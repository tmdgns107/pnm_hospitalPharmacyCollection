import fs from 'fs';
import Papa from 'papaparse';
import iconv from 'iconv-lite';
import mysql from 'mysql2/promise';
import { convertEPSGToWGS84, sleep } from './util.js';
import dbConfig from './db.config.json';

async function processCsvData(alias, type) {
    try{
        const csvFilePath = `./public_${type}.csv`;
        const csvBuffer = await fs.readFileSync(csvFilePath);
        const csvFile = iconv.decode(csvBuffer, 'euc-kr').toString();

        let { data } = Papa.parse(csvFile, {
            header: true, // CSV 파일의 첫 번째 줄을 헤더로 사용
        });

        let tableName = 'hospitals_test';
        if(type === 'pharmacy')
            tableName = 'pharmacies_test'

        if(alias === 'prod')
            tableName = tableName.replace('_test', '');

        const updateTime = new Date().toISOString();
        let filteredPublicData = data.filter(item => item["영업상태명"] && (item["영업상태명"].includes("휴업") || item["영업상태명"].includes("정상")))
            .slice(0, 10).map(item => {
            const address = item["소재지전체주소"]?.split(' ');
            const wgs84 = item["좌표정보(x)"] && item["좌표정보(y)"] ? convertEPSGToWGS84(Number(item["좌표정보(x)"]), Number(item["좌표정보(y)"])) : undefined;

            console.log("wgs84", wgs84);
            return {
                id: item["관리번호"],
                sidoNm: address?.[0] || "",
                sigunNm: address?.[1] || "",
                dongNm: address?.[2] || "",
                bizPlcNm: item["사업장명"],
                roadNmAddr: item["도로명전체주소"],
                lotNoAddr: item["소재지전체주소"],
                zipCode: item["도로명우편번호"],
                lat: wgs84?.[0] || "",
                lng: wgs84?.[1] || "",
                status: item["상세영업상태명"] || item["영업상태명"],
                telNo: item["소재지전화"],
                updateTime,
                collectDate: '2022-05-31',
                closedStartDate: item["휴업시작일자"] || "",
                closedEndDate: item["휴업종료일자"] || "",
                reopenDate: item["재개업일자"] || "",
            };
        });

        console.log("Data", JSON.stringify(data, null, 2));

        let connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            database: dbConfig.database
        });

        for(let publicData of filteredPublicData){
            const id = publicData.id;

            /** 기존에 병원데이터가 존재하는지 여부 확인 **/
            let searchQuery = `SELECT * FROM ${tableName} WHERE id = ?`
            let searchResult = await connection.execute(searchQuery, [id]);
            console.log("searchResult", searchResult[0]);

            if(searchResult && searchResult[0] && searchResult[0].length > 0) {
                /** 이미 병원이 존재한다면 데이터를 업데이트 진행 **/
                console.log("Exist publicData");
                const updateQuery =
                    `UPDATE ${tableName} SET 
                        sidoNm = ?, sigunNm = ?, dongNm = ?, bizPlcNm = ?, roadNmAddr = ?, 
                        lotNoAddr = ?, zipCode = ?, lat = ?, lng = ?, status = ?, 
                        telNo = ?, updateTime = ?, collectTime = ?, closedStartDate = ?,
                        closedEndDate = ?, reopenDate = ?
                    WHERE 
                        id = ?`;

                console.log(`updateQuery ${id}`, updateQuery);
                delete publicData.id;
                const values = Object.values(publicData);
                console.log("values", values);

                await connection.execute(updateQuery, [...values, id]);
                console.log(`A new row has been updated. id: ${id}`);
            }else{
                console.log("Not exist publicData");
                let insertQuery =
                    `INSERT INTO ${tableName} 
                    (id, sidoNm, sigunNm, dongNm, bizPlcNm, roadNmAddr, lotNoAddr, zipCode, lat, lng, status, telNo, createTime, updateTime, collectTime, closedStartDate, closedEndDate, reopenDate) 
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                console.log(`insertQuery ${id}`, insertQuery);
                publicData.createTime = publicData.updateTime;

                let values = [];
                for(let key in publicData)
                    values.push(publicData[key]);
                console.log("values", values);

                await connection.execute(insertQuery, values);

                console.log(`A new row has been inserted. id: ${id}`);
            }

            await sleep(100);
        }

        console.log("Data collection complete.")

    }catch (e) {
        console.log("Error in main", e);
    }
}

async function main() {
    await processCsvData('dev', 'hospital');
}

main();