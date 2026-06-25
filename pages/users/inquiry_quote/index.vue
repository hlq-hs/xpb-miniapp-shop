<template>
	<view class="quote-page">
		<view class="quote-body-wrap">
			<scroll-view
				scroll-y
				enhanced
				:bounces="false"
				show-scrollbar="false"
				class="quote-body"
				:style="quoteBodyStyle"
			>
				<view class="quote-content" :style="quoteContentStyle">
				<view class="search-panel">
					<view class="vin-shell">
						<view class="vin-input-wrap">
							<input
								v-model="vinCode"
								class="vin-input"
								type="text"
								maxlength="17"
								placeholder="输入VIN码或点击右侧扫描"
								placeholder-class="vin-placeholder"
							/>
							<text class="vin-count">{{ vinCodeLength }}/17</text>
						</view>
						<view class="scan-box" @click="handleScan">
							<view class="scan-frame">
								<view class="scan-line"></view>
							</view>
						</view>
					</view>
				</view>

				<view v-if="recentInquiryList.length" class="recent-section">
					<view class="recent-head">
						<text class="recent-title">最近询价</text>
					</view>
					<view
						v-for="item in recentInquiryList"
						:key="item.id"
						class="recent-card"
						@click="openRecentInquiry(item)"
					>
						<view class="recent-card-top">
							<view class="recent-main">
								<text class="recent-vehicle">{{ item.vehicleName }}</text>
								<text class="recent-vin">{{ item.vinCode }}</text>
								<text class="recent-inquiry-no">询价单号: {{ item.externalInquiryId || '--' }}</text>
							</view>
							<view class="recent-meta">
								<text class="recent-status" :class="item.statusClass">{{ item.statusText }}</text>
								<text class="recent-time">{{ item.createTime }}</text>
							</view>
						</view>
						<view class="recent-divider"></view>
						<text class="recent-parts">{{ item.partsText || '暂无配件信息' }}</text>
					</view>
				</view>

				<view class="steps-card">
					<text class="steps-title">询价更方便</text>

					<view class="step step-first">
						<view class="step-illustration illustration-left">
							<image
								class="guide-illustration"
								src="https://xpb.cn-shenzhen.oss.aliyuncs.com/235235/pt20260613170917009628500346.jpg?versionId=CAEQdBiBgMDTnvyA9hkiIDM0Y2JiNGIxMzEyOTQ3Yzc4YzdjZjExM2JmZDljZjU3"
								mode="aspectFit"
								@load="handleAssetReady"
								@error="handleAssetReady"
							/>
						</view>
						<view class="step-copy align-right">
							<text class="step-index">01</text>
							<text class="step-label">透明询价</text>
						</view>
					</view>

					<view class="step step-second">
						<view class="step-copy align-left">
							<text class="step-index">02</text>
							<text class="step-label multiline">常规配件点选</text>
						</view>
						<view class="step-illustration illustration-right">
							<image
								class="selection-illustration"
								src="https://xpb.cn-shenzhen.oss.aliyuncs.com/235235/pt202606131644418361280395948.jpg?versionId=CAEQdBiBgIDum8.A9hkiIGM1YjYxYTdhMGRhZjQ1NDA4YThiYzRmMDZiYjY3YmZk"
								mode="aspectFit"
								@load="handleAssetReady"
								@error="handleAssetReady"
							/>
						</view>
					</view>

					<view class="step step-third">
						<view class="step-illustration illustration-third">
							<image
								class="third-illustration"
								src="https://xpb.cn-shenzhen.oss.aliyuncs.com/235235/pt202606151048334411841309647.jpg?versionId=CAEQdBiBgIDJx9yk9hkiIGQ2YzdmMmYwOThhYTQ5ZjdhODAwOTc3NGI2OGE2OWRh"
								mode="aspectFit"
								@load="handleAssetReady"
								@error="handleAssetReady"
							/>
						</view>
						<view class="step-copy align-right">
							<text class="step-index">03</text>
							<text class="step-label">配件齐全</text>
						</view>
					</view>
				</view>
				</view>
			</scroll-view>
		</view>
		<view class="submit-bar">
			<view class="submit-btn" @click="submitQuote">询价</view>
		</view>
		<view v-if="isPageLoading" class="loading-mask">
			<view class="loading-panel">
				<view class="loading-spinner"></view>
				<text class="loading-text">Loading...</text>
			</view>
		</view>
	</view>
</template>

<script>
import { pathToBase64 } from '@/plugin/image-tools/index.js';

const VIN_REGEX = /[A-HJ-NPR-Z0-9]{17}/;
const BAIDU_TOKEN_BUFFER_SECONDS = 120;
const baiduTokenCache = {
	token: '',
	expireAt: 0,
	pending: null
};

export default {
	data() {
		return {
			vinCode: '',
			vinImagePath: '',
			vinUploadKey: '',
			recentInquiryList: [],
			contentTopOffset: 88,
			isPageLoading: true,
			isViewReady: false,
			pendingAssetCount: 3,
			isSubmitting: false,
			isRecognizingVin: false
		};
	},
	computed: {
		quoteBodyStyle() {
			return {
				height: '100%'
			};
		},
		quoteContentStyle() {
			return {
				paddingTop: `${this.contentTopOffset}px`
			};
		},
		vinCodeLength() {
			return (this.vinCode || '').length;
		}
	},
	onLoad(options = {}) {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
		let contentTopOffset = (info.statusBarHeight || 20) + 20;

		// #ifdef MP-WEIXIN
		const menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
		if (menuButton && menuButton.bottom) {
			contentTopOffset = menuButton.bottom + 12;
		}
		// #endif

		this.contentTopOffset = contentTopOffset;
		this.vinUploadKey = this.safeDecode(options.key || options.vinKey || '');
		this.fetchRecentInquiryList();
		this.warmupBaiduAccessToken();
	},
	onShow() {
		this.fetchRecentInquiryList();
	},
	onReady() {
		this.isViewReady = true;
		this.tryHideLoading();
	},
	methods: {
		safeDecode(value) {
			if (value === undefined || value === null) return '';
			try {
				return decodeURIComponent(value);
			} catch (error) {
				return String(value);
			}
		},
		getCachedRecentUserInfo() {
			const cachedUserInfo = uni.getStorageSync('USER_INFO') || {};
			if (cachedUserInfo && typeof cachedUserInfo === 'object') {
				return cachedUserInfo;
			}
			return {};
		},
		getRecentInquiryPayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || this.getCachedRecentUserInfo() || {};
			return {
				beginOpTime: null,
				endOpTime: null,
				externalInquiryId: '',
				mobile: String(userInfo.phone || userInfo.mobile || '').trim(),
				pageno: 1,
				pagesize: 20,
				requestStatus: null,
				userId: Number(getters.uid || 0) || 0,
			};
		},
		requestRecentInquiryList(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/QuotationRequest/GetList',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: res => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		parseRecentUserNeeds(userNeeds) {
			if (!userNeeds) return [];
			if (Array.isArray(userNeeds)) return userNeeds;
			if (typeof userNeeds === 'string') {
				try {
					const parsed = JSON.parse(userNeeds);
					return Array.isArray(parsed) ? parsed : [];
				} catch (error) {
					return [];
				}
			}
			return [];
		},
		getRecentInquiryStatusText(status) {
			const textMap = {
				1: '待报价',
				2: '已报价',
				3: '已过期',
				4: '译码失败',
				6: '已下单'
			};
			return textMap[Number(status) || 1] || '待报价';
		},
		getRecentInquiryStatusClass(status) {
			const classMap = {
				1: 'is-pending',
				2: 'is-quoted',
				3: 'is-expired',
				4: 'is-failed',
				6: 'is-ordered'
			};
			return classMap[Number(status) || 1] || 'is-pending';
		},
		formatRecentTime(value) {
			if (!value) return '';
			return String(value).replace('T', ' ').slice(0, 19);
		},
		normalizeRecentInquiryList(list) {
			if (!Array.isArray(list)) return [];
			return list.map((item, index) => {
				const userNeeds = this.parseRecentUserNeeds(item && item.userNeeds);
				return {
					id: item.id || item.externalInquiryId || `recent-${index}`,
					externalInquiryId: item.externalInquiryId || '',
					vehicleName: item.carModelName || [item.carBrandName, item.carModelName].filter(Boolean).join(' ') || '车型信息',
					vinCode: item.vin || '',
					statusText: this.getRecentInquiryStatusText(item.requestStatus),
					statusClass: this.getRecentInquiryStatusClass(item.requestStatus),
					partsText: userNeeds
						.map(need => need.needsName || need.oeName || need.stdName || '')
						.filter(Boolean)
						.join('、'),
					contactName: item.userName || item.contactName || '',
					createTime: this.formatRecentTime(item.opTime),
					raw: item
				};
			});
		},
		async fetchRecentInquiryList() {
			let payload = this.getRecentInquiryPayload();
			if (payload.userId && !payload.mobile && this.$store && this.$store.dispatch) {
				try {
					await this.$store.dispatch('USERINFO');
				} catch (error) {
				}
				payload = this.getRecentInquiryPayload();
			}
			if (!payload.userId || !payload.mobile) {
				this.recentInquiryList = [];
				return;
			}
			try {
				const result = await this.requestRecentInquiryList(payload);
				if (!result || Number(result.msgid) !== 200) {
					this.recentInquiryList = [];
					return;
				}
				const list = this.normalizeRecentInquiryList(result.data)
					.sort((a, b) => {
						const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
						const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
						return timeB - timeA;
					})
					.slice(0, 2);
				this.recentInquiryList = list;
			} catch (error) {
				this.recentInquiryList = [];
			}
		},
		openInquiryHistory() {
			uni.navigateTo({
				url: '/pages/users/inquiry_history/index'
			});
		},
		openRecentInquiry(item) {
			uni.setStorageSync('inquiryOrderHistoryCurrent', item.raw || item);
			uni.navigateTo({
				url: `/pages/users/inquiry_order/index?id=${encodeURIComponent(item.id || '')}&externalInquiryId=${encodeURIComponent(item.externalInquiryId || '')}&vinCode=${encodeURIComponent(item.vinCode || '')}&vehicleName=${encodeURIComponent(item.vehicleName || '')}`
			});
		},
		handleAssetReady() {
			if (this.pendingAssetCount > 0) {
				this.pendingAssetCount -= 1;
			}
			this.tryHideLoading();
		},
		tryHideLoading() {
			if (this.isViewReady && this.pendingAssetCount <= 0) {
				this.isPageLoading = false;
			}
		},
		compressImage(src) {
			return new Promise((resolve) => {
				if (!src || !uni.compressImage) {
					resolve(src);
					return;
				}
				uni.compressImage({
					src,
					quality: 60,
					success: (res) => resolve((res && res.tempFilePath) || src),
					fail: () => resolve(src)
				});
			});
		},
		async getImageBase64Content(filePath) {
			const compressedPath = await this.compressImage(filePath);
			const base64 = await pathToBase64(compressedPath || filePath);
			const commaIndex = String(base64 || '').indexOf(',');
			return commaIndex > -1 ? base64.slice(commaIndex + 1) : String(base64 || '');
		},
		requestBaiduOauth() {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbhd.kbiso.com/postData.ashx?action=GetBaiduOauth',
					method: 'GET',
					timeout: 15000,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		extractAccessTokenExpiresIn(result) {
			if (!result) return 0;
			if (typeof result === 'string') {
				try {
					return this.extractAccessTokenExpiresIn(JSON.parse(result));
				} catch (error) {
					return 0;
				}
			}
			if (typeof result.data === 'string') {
				try {
					return this.extractAccessTokenExpiresIn(JSON.parse(result.data));
				} catch (error) {
					return 0;
				}
			}
			return Number(
				result.expires_in ||
				(result.data && result.data.expires_in) ||
				(result.result && result.result.expires_in) ||
				0
			);
		},
		extractAccessToken(result) {
			if (!result) return '';
			if (typeof result === 'string') {
				try {
					const parsed = JSON.parse(result);
					return this.extractAccessToken(parsed);
				} catch (error) {
					return '';
				}
			}
			if (typeof result.data === 'string') {
				try {
					const parsedData = JSON.parse(result.data);
					return this.extractAccessToken(parsedData);
				} catch (error) {
				}
			}
			return (
				result.access_token ||
				(result.data && result.data.access_token) ||
				(result.result && result.result.access_token) ||
				''
			);
		},
		async getBaiduAccessToken(forceRefresh = false) {
			const now = Date.now();
			if (!forceRefresh && baiduTokenCache.token && baiduTokenCache.expireAt > now) {
				return baiduTokenCache.token;
			}
			if (!forceRefresh && baiduTokenCache.pending) {
				return baiduTokenCache.pending;
			}

			baiduTokenCache.pending = this.requestBaiduOauth()
				.then((oauthResult) => {
					const accessToken = this.extractAccessToken(oauthResult);
					const expiresIn = this.extractAccessTokenExpiresIn(oauthResult);
					if (!accessToken) {
						throw new Error('EMPTY_ACCESS_TOKEN');
					}

					baiduTokenCache.token = accessToken;
					baiduTokenCache.expireAt = Date.now() + Math.max(expiresIn - BAIDU_TOKEN_BUFFER_SECONDS, 60) * 1000;
					return accessToken;
				})
				.finally(() => {
					baiduTokenCache.pending = null;
				});

			return baiduTokenCache.pending;
		},
		warmupBaiduAccessToken() {
			this.getBaiduAccessToken().catch(() => {});
		},
		requestBaiduOcr(url, imageBase64) {
			return new Promise((resolve, reject) => {
				uni.request({
					url,
					method: 'POST',
					timeout: 20000,
					header: {
						'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
					},
					data: `image=${encodeURIComponent(imageBase64)}`,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		normalizeVinText(value) {
			return String(value || '')
				.toUpperCase()
				.replace(/[^A-Z0-9]/g, '');
		},
		extractVinFromVinCodeResult(result) {
			const firstWord = result && result.words_result && result.words_result[0] && result.words_result[0].words;
			const vin = this.normalizeVinText(firstWord);
			return vin.length === 17 ? vin : '';
		},
		extractVinFromGeneralResult(result) {
			const wordsList = Array.isArray(result && result.words_result) ? result.words_result : [];
			for (const item of wordsList) {
				const vin = this.normalizeVinText(item && item.words);
				if (vin.length === 17 && VIN_REGEX.test(vin)) {
					return vin;
				}
			}
			const mergedText = this.normalizeVinText(
				wordsList.map(item => (item && item.words) || '').join('')
			);
			const match = mergedText.match(VIN_REGEX);
			return match ? match[0] : '';
		},
		reportRecognizedVin(vin) {
			if (!vin) return Promise.resolve({});
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/Kaisi/SetVinUrl',
					method: 'POST',
					timeout: 10000,
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						vin,
						key: this.vinUploadKey || ''
					},
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		async recognizeVinFromImage(imagePath) {
			const imageBase64 = await this.getImageBase64Content(imagePath);
			if (!imageBase64) {
				throw new Error('EMPTY_IMAGE_BASE64');
			}

			const accessToken = await this.getBaiduAccessToken();

			const vinCodeResult = await this.requestBaiduOcr(
				`https://aip.baidubce.com/rest/2.0/ocr/v1/vin_code?access_token=${accessToken}`,
				imageBase64
			);
			let vin = this.extractVinFromVinCodeResult(vinCodeResult);

			if (!vin) {
				const generalResult = await this.requestBaiduOcr(
					`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
					imageBase64
				);
				vin = this.extractVinFromGeneralResult(generalResult);
			}

			if (!vin) {
				throw new Error('VIN_NOT_FOUND');
			}

			this.reportRecognizedVin(vin).catch(() => {});
			return vin;
		},
		showNoneToast(title, duration = 2200) {
			uni.hideLoading();
			setTimeout(() => {
				uni.showToast({
					title,
					icon: 'none',
					duration
				});
			}, 80);
		},
		getVinRecognitionErrorMessage(error) {
			const message = String((error && (error.message || error.errMsg)) || error || '');
			if (message === 'VIN_NOT_FOUND') {
				return '未识别到VIN码，请重新拍摄或手动输入';
			}
			if (message === 'EMPTY_ACCESS_TOKEN') {
				return '识别服务授权失败，请稍后重试';
			}
			if (message === 'EMPTY_IMAGE_BASE64') {
				return '图片读取失败，请重新选择';
			}
			if (/timeout|timed out|超时/i.test(message)) {
				return '识别接口超时，请稍后重试';
			}
			if (/request:fail|fail|network|网络/i.test(message)) {
				return '识别接口请求失败，请检查网络';
			}
			return 'VIN识别失败，请手动输入';
		},
		handleScan() {
			if (this.isRecognizingVin) return;

			uni.chooseImage({
				count: 1,
				sizeType: ['original', 'compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const imagePath = res.tempFilePaths && res.tempFilePaths[0];
					if (!imagePath) {
						this.showNoneToast('未获取到图片，请重试');
						return;
					}

					this.vinImagePath = imagePath;
					this.isRecognizingVin = true;
					uni.showLoading({
						title: '识别中',
						mask: true
					});

					try {
						const vin = await this.recognizeVinFromImage(imagePath);
						this.vinCode = vin;
						await this.proceedWithVin(vin, '查询中');
					} catch (error) {
						this.showNoneToast(this.getVinRecognitionErrorMessage(error));
					} finally {
						this.isRecognizingVin = false;
						uni.hideLoading();
					}
				},
				fail: (error) => {
					const errorMessage = error && error.errMsg ? error.errMsg : '';
					if (errorMessage.includes('cancel')) return;

					this.showNoneToast('图片选择失败');
				}
			});
		},
		queryVinInfo(vin) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/vin',
					method: 'GET',
					timeout: 15000,
					data: {
						vin
					},
					success: (res) => {
						resolve((res && res.data) || {});
					},
					fail: reject
				});
			});
		},
		getVehicleName(vehicleInfo) {
			if (!vehicleInfo) return '';

			return (
				vehicleInfo.saleModelName ||
				[vehicleInfo.carBrandName, vehicleInfo.seriesZh, vehicleInfo.carModelName]
					.filter(Boolean)
					.join(' ')
			);
		},
		async proceedWithVin(vinCode, loadingTitle = '查询中') {
			const normalizedVin = (vinCode || '').trim().toUpperCase();
			if (normalizedVin.length !== 17) {
				this.showNoneToast('请输入17位VIN码');
				return false;
			}

			if (this.isSubmitting) return;

			this.vinCode = normalizedVin;
			this.isSubmitting = true;
			uni.showLoading({
				title: loadingTitle,
				mask: true
			});

			try {
				const result = await this.queryVinInfo(normalizedVin);
				const vehicleList = Array.isArray(result.data) ? result.data : [];
				const rawVehicleInfo = vehicleList[0] || {};
				const vehicleInfo = {
					...rawVehicleInfo,
					carBrandId: rawVehicleInfo.carBrandCode || rawVehicleInfo.carBrandId || rawVehicleInfo.brandId || ''
				};
				const vehicleName = this.getVehicleName(vehicleInfo);

				if (!vehicleName) {
					this.showNoneToast(result.msgtext || '未查询到车型信息');
					return false;
				}

				uni.setStorageSync('inquiryVehicleInfo', vehicleInfo);
				uni.navigateTo({
					url: `/pages/users/inquiry_parts/index?vin=${encodeURIComponent(normalizedVin)}&vehicleName=${encodeURIComponent(vehicleName)}`
				});
				return true;
			} catch (error) {
				const message = String((error && (error.errMsg || error.message)) || error || '');
				this.showNoneToast(/timeout|超时/i.test(message) ? '车型查询超时，请稍后重试' : '查询失败，请稍后重试');
				return false;
			} finally {
				this.isSubmitting = false;
				uni.hideLoading();
			}
		},
		async submitQuote() {
			await this.proceedWithVin(this.vinCode, '查询中');
		}
	}
};
</script>

<style scoped lang="scss">
.quote-page {
	height: 100vh;
	background: #ffffff;
	position: relative;
	overflow: hidden;
}

.quote-body {
	height: 100%;
	background: #ffffff;
	position: relative;
	z-index: 0;
	box-sizing: border-box;
}

.quote-body-wrap {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: calc(120rpx + env(safe-area-inset-bottom));
	overflow: hidden;
}

.quote-content {
	min-height: 100%;
	background: #ffffff;
	padding-bottom: 92rpx;
	box-sizing: border-box;
}

.search-panel {
	display: flex;
	align-items: center;
	padding: 28rpx 54rpx 22rpx;
	background: #ffffff;
}

.recent-section {
	padding: 0 34rpx 12rpx;
}

.recent-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8rpx 6rpx 18rpx;
}

.recent-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1d2433;
}

.recent-card {
	margin-bottom: 18rpx;
	padding: 24rpx 24rpx 20rpx;
	border-radius: 22rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 22rpx rgba(38, 57, 79, 0.05);
}

.recent-card-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 18rpx;
}

.recent-main {
	flex: 1;
	min-width: 0;
}

.recent-vehicle {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #20252d;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.recent-vin {
	display: block;
	margin-top: 8rpx;
	font-size: 26rpx;
	color: #8f96a0;
	word-break: break-all;
}

.recent-inquiry-no {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #8f96a0;
	word-break: break-all;
}

.recent-meta {
	flex-shrink: 0;
	margin-left: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	row-gap: 12rpx;
}

.recent-status {
	flex-shrink: 0;
	padding: 8rpx 16rpx;
	border-radius: 10rpx;
	font-size: 24rpx;
	font-weight: 600;
}

.recent-status.is-pending,
.recent-status.is-quoted {
	color: #14a264;
	background: #eefbf4;
}

.recent-status.is-expired {
	color: #d97706;
	background: #fff7e8;
}

.recent-status.is-failed {
	color: #dc2626;
	background: #fff1f2;
}

.recent-status.is-ordered {
	color: #2563eb;
	background: #eef4ff;
}

.recent-divider {
	height: 1rpx;
	margin: 18rpx 0;
	background: #edf1f6;
}

.recent-parts {
	display: block;
	font-size: 28rpx;
	line-height: 1.6;
	color: #303640;
}

.recent-time {
	display: block;
	font-size: 24rpx;
	color: #9aa0a9;
	line-height: 1;
}

.vin-shell {
	flex: 1;
	height: 82rpx;
	border: 4rpx solid #1d7df0;
	border-radius: 24rpx;
	background: #1d7df0;
	display: flex;
	align-items: stretch;
	overflow: hidden;
	box-shadow: 0 10rpx 24rpx rgba(29, 125, 240, 0.08);
}

.vin-input-wrap {
	flex: 1;
	height: 100%;
	min-width: 0;
	padding: 0 16rpx 0 26rpx;
	display: flex;
	align-items: center;
	background: #ffffff;
	box-sizing: border-box;
}

.vin-input {
	flex: 1;
	min-width: 0;
	height: 100%;
	font-size: 28rpx;
	color: #2d3440;
	background: #ffffff;
}

.vin-placeholder {
	color: #aeb8c6;
}

.vin-count {
	flex-shrink: 0;
	margin-left: 8rpx;
	font-size: 25rpx;
	line-height: 1;
	color: #ff4d43;
}

.scan-box {
	width: 116rpx;
	height: 100%;
	margin-right: -4rpx;
	border-radius: 0 20rpx 20rpx 0;
	background: linear-gradient(180deg, #2586f3 0%, #1b73e1 100%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.scan-frame {
	position: relative;
	width: 46rpx;
	height: 46rpx;
	border: 5rpx solid #ffffff;
	border-radius: 10rpx;
	overflow: hidden;
}

.scan-line {
	position: absolute;
	left: 5rpx;
	top: 5rpx;
	width: 36rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.58);
	box-shadow: 0 0 8rpx rgba(255, 255, 255, 0.42);
	animation: scanMove 1.5s ease-in-out infinite alternate;
}

.steps-card {
	margin-top: 18rpx;
	padding: 44rpx 0 12rpx;
	border-radius: 36rpx 36rpx 0 0;
	background: #ffffff;
	box-shadow: none;
}

.steps-title {
	display: block;
	text-align: center;
	font-size: 60rpx;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: #d7d9de;
}

.step {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 38rpx 0;
}

.step-first {
	min-height: 330rpx;
}

.step-second {
	min-height: 350rpx;
}

.step-third {
	min-height: 210rpx;
}

.step-copy {
	display: flex;
	flex-direction: column;
	row-gap: 12rpx;
}

.align-right {
	align-items: flex-start;
	padding-right: 10rpx;
}

.align-left {
	align-items: flex-start;
	padding-left: 4rpx;
}

.step-index {
	font-size: 100rpx;
	font-weight: 700;
	line-height: 0.9;
	color: #dfe1e5;
}

.step-label {
	font-size: 42rpx;
	font-weight: 500;
	line-height: 1.2;
	color: #8a8f99;
}

.multiline {
	max-width: 230rpx;
}

.step-illustration {
	position: relative;
	flex-shrink: 0;
}

.illustration-left {
	width: 300rpx;
	height: 260rpx;
	margin-left: 8rpx;
}

.guide-illustration {
	position: absolute;
	left: -10rpx;
	top: 0;
	width: 270rpx;
	height: 260rpx;
}

.illustration-right {
	width: 290rpx;
	height: 270rpx;
	margin-right: 8rpx;
}

.illustration-third {
	width: 390rpx;
	height: 240rpx;
	margin-left: 0;
}

.third-illustration {
	width: 100%;
	height: 100%;
	display: block;
}

.selection-illustration {
	position: absolute;
	right: -24rpx;
	bottom: -22rpx;
	width: 310rpx;
	height: 310rpx;
}

.guide-panel {
	position: absolute;
	left: 150rpx;
	top: 14rpx;
	width: 146rpx;
	height: 178rpx;
	border-radius: 18rpx;
	border: 4rpx solid #dbe5f2;
	background: rgba(255, 255, 255, 0.82);
	box-shadow: 0 10rpx 24rpx rgba(72, 116, 181, 0.08);
}

.guide-car {
	position: absolute;
	left: 168rpx;
	top: 30rpx;
	width: 108rpx;
	height: 42rpx;
	border-radius: 18rpx;
	background: linear-gradient(180deg, #eef4fb 0%, #dde8f6 100%);
}

.guide-note {
	position: absolute;
	left: 168rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: #dfe7f2;
}

.guide-note-top {
	top: 88rpx;
	width: 92rpx;
}

.guide-note-mid {
	top: 108rpx;
	width: 98rpx;
}

.guide-phone {
	position: absolute;
	left: 222rpx;
	top: 112rpx;
	width: 50rpx;
	height: 88rpx;
	border-radius: 15rpx;
	border: 4rpx solid #8db8ea;
	background: #ffffff;
	z-index: 3;
}

.guide-phone::before {
	content: '';
	position: absolute;
	left: 50%;
	top: 6rpx;
	width: 18rpx;
	height: 5rpx;
	border-radius: 999rpx;
	background: #c8d8eb;
	transform: translateX(-50%);
}

.guide-phone-camera {
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	background: #8db8ea;
	margin: 30rpx auto 0;
}

.female-figure {
	position: absolute;
	left: 42rpx;
	top: 18rpx;
	width: 224rpx;
	height: 264rpx;
	z-index: 2;
}

.female-head {
	position: absolute;
	left: 40rpx;
	top: 0;
	width: 90rpx;
	height: 114rpx;
}

.female-head::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 90rpx;
	height: 98rpx;
	border-radius: 46rpx 46rpx 18rpx 18rpx;
	background: #4f2b22;
}

.female-head::after {
	content: '';
	position: absolute;
	left: 8rpx;
	top: 52rpx;
	width: 24rpx;
	height: 54rpx;
	border-radius: 0 0 6rpx 6rpx;
	background: #4f2b22;
}

.female-face {
	position: absolute;
	left: 20rpx;
	top: 18rpx;
	width: 48rpx;
	height: 60rpx;
	border-radius: 24rpx;
	background: #ffd9cb;
}

.female-face::before,
.female-face::after {
	content: '';
	position: absolute;
	top: 22rpx;
	width: 5rpx;
	height: 5rpx;
	border-radius: 50%;
	background: #4b2a25;
}

.female-face::before {
	left: 10rpx;
}

.female-face::after {
	right: 10rpx;
}

.female-body {
	position: absolute;
	left: 0;
	top: 106rpx;
	width: 190rpx;
	height: 140rpx;
	border-radius: 48rpx 48rpx 18rpx 18rpx;
	background: linear-gradient(180deg, #ffd663 0%, #f2b948 100%);
}

.female-body::before,
.female-body::after {
	content: '';
	position: absolute;
	top: 56rpx;
	width: 4rpx;
	height: 42rpx;
	border-radius: 999rpx;
	background: #272118;
}

.female-body::before {
	left: 28rpx;
}

.female-body::after {
	right: 30rpx;
}

.female-arm {
	position: absolute;
	left: 136rpx;
	top: 140rpx;
	width: 110rpx;
	height: 26rpx;
	border-radius: 999rpx;
	background: #ffd9cb;
	transform: rotate(-46deg);
	transform-origin: left center;
}

.female-hand {
	position: absolute;
	left: 208rpx;
	top: 152rpx;
	width: 18rpx;
	height: 34rpx;
	border-radius: 12rpx;
	background: #ffd9cb;
	z-index: 4;
}

.female-forearm {
	position: absolute;
	left: 22rpx;
	bottom: 24rpx;
	width: 132rpx;
	height: 24rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, #ffe2d7 0%, #ffd2c0 100%);
	z-index: 3;
}

.ground-line {
	position: absolute;
	height: 4rpx;
	border-radius: 999rpx;
	background: #b8bbc2;
}

.ground-line-left {
	left: 18rpx;
	bottom: 14rpx;
	width: 250rpx;
}

.selection-phone {
	position: absolute;
	left: 88rpx;
	top: 72rpx;
	width: 96rpx;
	height: 166rpx;
	border-radius: 22rpx;
	border: 4rpx solid #8db8ea;
	background: #ffffff;
	box-shadow: 0 12rpx 24rpx rgba(84, 132, 201, 0.08);
	z-index: 3;
}

.selection-notch {
	width: 36rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: #c7d8ec;
	margin: 12rpx auto 0;
}

.selection-line {
	width: 58rpx;
	height: 14rpx;
	border-radius: 999rpx;
	background: #e8eff8;
	margin: 18rpx auto 0;
}

.selection-line-active {
	background: #8dbbf1;
}

.male-figure {
	position: absolute;
	right: 26rpx;
	bottom: 12rpx;
	width: 154rpx;
	height: 164rpx;
	z-index: 2;
}

.male-head {
	position: absolute;
	left: 42rpx;
	top: 18rpx;
	width: 64rpx;
	height: 74rpx;
}

.male-head::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 64rpx;
	height: 34rpx;
	border-radius: 28rpx 28rpx 18rpx 18rpx;
	background: #4b2b26;
}

.male-face {
	position: absolute;
	left: 8rpx;
	top: 18rpx;
	width: 48rpx;
	height: 48rpx;
	border-radius: 26rpx;
	background: #ffd8cb;
}

.male-body {
	position: absolute;
	left: 20rpx;
	top: 78rpx;
	width: 118rpx;
	height: 92rpx;
	border-radius: 28rpx 28rpx 18rpx 18rpx;
	background: linear-gradient(180deg, #28346a 0%, #1f2856 100%);
}

.male-arm {
	position: absolute;
	left: 4rpx;
	top: 92rpx;
	width: 64rpx;
	height: 24rpx;
	border-radius: 999rpx;
	background: #ffd8cb;
	transform: rotate(-18deg);
	transform-origin: right center;
}

.ground-line-right {
	left: 88rpx;
	bottom: 14rpx;
	width: 182rpx;
}

.submit-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	padding: 16rpx 0 calc(16rpx + env(safe-area-inset-bottom));
	background: #ffffff;
}

.submit-btn {
	margin: 0 34rpx;
	height: 88rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(180deg, #2485f4 0%, #1975e5 100%);
	box-shadow: 0 18rpx 32rpx rgba(29, 120, 232, 0.22);
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.92);
}

.loading-panel {
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 18rpx;
}

.loading-spinner {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(29, 125, 240, 0.16);
	border-top-color: #1d7df0;
	animation: spin 0.9s linear infinite;
}

.loading-text {
	font-size: 28rpx;
	color: #6b7788;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

@keyframes scanMove {
	from {
		transform: translateY(0);
	}

	to {
		transform: translateY(32rpx);
	}
}
</style>
