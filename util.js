import proj4 from "proj4";

export function convertEPSGToWGS84(epsgX, epsgY) {
    const epsgProjection = '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43';
    const wgs84Projection = '+proj=longlat +datum=WGS84 +no_defs';

    // 좌표체계 변환
    const wgs84Coordinates = proj4(epsgProjection, wgs84Projection, [Number(epsgX)+255, Number(epsgY)]);

    // 변환된 WGS84 좌표 반환
    return [wgs84Coordinates[1], wgs84Coordinates[0]]
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}