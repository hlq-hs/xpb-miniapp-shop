import { pathToBase64 } from '@/plugin/image-tools/index.js';

const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/;
const TOKEN_BUFFER_SECONDS = 120;
const tokenCache = {
	token: '',
	expireAt: 0,
	pending: null
};

function request(options) {
	return new Promise((resolve, reject) => {
		uni.request({
			...options,
			success: res => resolve((res && res.data) || {}),
			fail: reject
		});
	});
}

function compressImage(src) {
	return new Promise((resolve) => {
		if (!src || !uni.compressImage) {
			resolve(src);
			return;
		}
		uni.compressImage({
			src,
			quality: 60,
			success: res => resolve((res && res.tempFilePath) || src),
			fail: () => resolve(src)
		});
	});
}

async function getImageBase64Content(filePath) {
	const compressedPath = await compressImage(filePath);
	const base64 = await pathToBase64(compressedPath || filePath);
	const text = String(base64 || '');
	const commaIndex = text.indexOf(',');
	return commaIndex > -1 ? text.slice(commaIndex + 1) : text;
}

function extractToken(result) {
	if (!result) return '';
	if (typeof result === 'string') {
		try {
			return extractToken(JSON.parse(result));
		} catch (error) {
			return '';
		}
	}
	if (typeof result.data === 'string') {
		try {
			return extractToken(JSON.parse(result.data));
		} catch (error) {
		}
	}
	return result.access_token ||
		(result.data && result.data.access_token) ||
		(result.result && result.result.access_token) || '';
}

function extractExpiresIn(result) {
	if (!result) return 0;
	if (typeof result === 'string') {
		try {
			return extractExpiresIn(JSON.parse(result));
		} catch (error) {
			return 0;
		}
	}
	if (typeof result.data === 'string') {
		try {
			return extractExpiresIn(JSON.parse(result.data));
		} catch (error) {
			return 0;
		}
	}
	return Number(result.expires_in ||
		(result.data && result.data.expires_in) ||
		(result.result && result.result.expires_in) || 0);
}

function getAccessToken() {
	const now = Date.now();
	if (tokenCache.token && tokenCache.expireAt > now) return Promise.resolve(tokenCache.token);
	if (tokenCache.pending) return tokenCache.pending;
	tokenCache.pending = request({
		url: 'https://xpbhd.kbiso.com/postData.ashx?action=GetBaiduOauth',
		method: 'GET',
		timeout: 15000
	}).then((result) => {
		const token = extractToken(result);
		const expiresIn = extractExpiresIn(result);
		if (!token) throw new Error('EMPTY_ACCESS_TOKEN');
		tokenCache.token = token;
		tokenCache.expireAt = Date.now() + Math.max(expiresIn - TOKEN_BUFFER_SECONDS, 60) * 1000;
		return token;
	}).finally(() => {
		tokenCache.pending = null;
	});
	return tokenCache.pending;
}

function normalizeVin(value) {
	return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function extractVin(result) {
	const words = Array.isArray(result && result.words_result) ? result.words_result : [];
	for (let i = 0; i < words.length; i += 1) {
		const vin = normalizeVin(words[i] && words[i].words);
		if (vin.length === 17 && VIN_REGEX.test(vin)) return vin;
	}
	const merged = normalizeVin(words.map(item => (item && item.words) || '').join(''));
	const match = merged.match(VIN_REGEX);
	return match ? match[0] : '';
}

function requestOcr(url, imageBase64) {
	return request({
		url,
		method: 'POST',
		timeout: 20000,
		header: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
		data: `image=${encodeURIComponent(imageBase64)}`
	});
}

export function chooseVinImage() {
	return new Promise((resolve, reject) => {
		uni.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['camera', 'album'],
			success: (res) => {
				const path = res.tempFilePaths && res.tempFilePaths[0];
				path ? resolve(path) : reject(new Error('EMPTY_IMAGE'));
			},
			fail: (error) => {
				const message = String((error && error.errMsg) || '');
				reject(new Error(message.includes('cancel') ? 'IMAGE_CANCELLED' : 'IMAGE_SELECT_FAILED'));
			}
		});
	});
}

export async function recognizeVinFromImage(imagePath) {
	const imageBase64 = await getImageBase64Content(imagePath);
	if (!imageBase64) throw new Error('EMPTY_IMAGE_BASE64');
	const accessToken = await getAccessToken();
	const vinResult = await requestOcr(
		`https://aip.baidubce.com/rest/2.0/ocr/v1/vin_code?access_token=${accessToken}`,
		imageBase64
	);
	let vin = extractVin(vinResult);
	if (!vin) {
		const generalResult = await requestOcr(
			`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
			imageBase64
		);
		vin = extractVin(generalResult);
	}
	if (!vin) throw new Error('VIN_NOT_FOUND');
	request({
		url: 'https://xpbn.kbiso.com/api/Kaisi/SetVinUrl',
		method: 'POST',
		timeout: 10000,
		header: { 'Content-Type': 'application/json' },
		data: { vin, key: '' }
	}).catch(() => {});
	return vin;
}

export function queryVehicleByVin(vin) {
	return request({
		url: 'https://xpbn.kbiso.com/api/MiniKaisi/vin',
		method: 'GET',
		timeout: 15000,
		data: { vin }
	});
}

export function getVinRecognitionErrorMessage(error) {
	const message = String((error && (error.message || error.errMsg)) || error || '');
	if (message === 'IMAGE_CANCELLED') return '';
	if (message === 'VIN_NOT_FOUND') return '未识别到VIN码，请重新拍摄';
	if (message === 'EMPTY_ACCESS_TOKEN') return '识别服务授权失败，请稍后重试';
	if (message === 'EMPTY_IMAGE' || message === 'EMPTY_IMAGE_BASE64') return '图片读取失败，请重新选择';
	if (message === 'IMAGE_SELECT_FAILED') return '图片选择失败';
	if (/timeout|timed out|超时/i.test(message)) return '识别接口超时，请稍后重试';
	if (/request:fail|fail|network|网络/i.test(message)) return '识别接口请求失败，请检查网络';
	return 'VIN识别失败，请重新拍摄';
}
