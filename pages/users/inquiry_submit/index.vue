<template>
	<view class="submit-page">
		<scroll-view scroll-y class="submit-body">
			<view class="vehicle-card">
				<text class="vehicle-name">{{ vehicleName }}</text>
				<text class="vehicle-vin">VIN: {{ vinCode }}</text>
			</view>

			<view v-for="(part, index) in parts" :key="part.id" class="part-card">
				<view class="part-head">
					<view class="part-name-wrap">
						<text class="part-name">{{ part.name }}</text>
						<text class="oe-code">{{ getDisplayOeCode(part) }}</text>
					</view>
					<view class="quantity-control">
						<view class="quantity-btn minus" @click="decreasePart(index)">-</view>
						<text class="quantity">{{ part.quantity }}</text>
						<view class="quantity-btn plus" @click="increasePart(index)">+</view>
						<view class="delete-btn" @click="removePart(index)">删</view>
					</view>
				</view>

				<view class="part-info">
					<view class="info-line price-line">
						<text class="info-label">4S参考价:</text>
						<text class="price-text" :class="{ unknown: isUnknownPrice(part) }">{{ formatPrice(part) }}</text>
					</view>
					<view class="info-line">
						<text class="info-label">品质:</text>
						<text class="quality-text">{{ selectedQualityLabelsText }}</text>
					</view>
					<view class="info-line note-line">
						<text class="info-label">备注:</text>
						<input
							class="remark-input"
							:value="part.remark"
							placeholder="请输入配件备注"
							placeholder-class="input-placeholder"
							@input="handleRemarkInput(index, $event)"
						/>
					</view>
					<view class="info-line image-line">
						<text class="info-label">图片:</text>
						<view class="image-list">
							<view
								v-for="(image, imageIndex) in part.images"
								:key="image"
								class="image-item"
							>
								<image
									class="part-image"
									:src="image"
									mode="aspectFill"
									@click="previewPartImage(part.images, imageIndex)"
								/>
								<view class="image-remove" @click.stop="removePartImage(index, imageIndex)">×</view>
							</view>
							<view
								v-if="part.images.length < 6"
								class="upload-box"
								@click="choosePartImage(index)"
							>
								<text class="upload-plus">+</text>
								<text class="upload-count">{{ part.images.length }}/6</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-if="!parts.length" class="empty-parts">暂无配件，请返回重新选择</view>

			<view class="section-card quality-summary">
				<text class="summary-label">品质?</text>
				<text class="summary-value">按整单选</text>
			</view>

			<view class="section-card quality-options">
				<view
					v-for="quality in qualityOptions"
					:key="quality.label"
					class="quality-chip"
					:class="{ active: isQualitySelected(quality) }"
					@click="toggleQuality(quality)"
				>
					{{ quality.label }}
				</view>
			</view>

			<view class="section-card supplier-card">
				<text class="section-title">供应商</text>
				<view class="supplier-options">
					<view class="check-option" @click="toggleSupplierOption('smart')">
						<view class="checkbox" :class="{ checked: supplierOptions.smart }">
							<text v-if="supplierOptions.smart">√</text>
						</view>
						<text>智能推荐</text>
					</view>
					<view class="check-option" @click="toggleSupplierOption('specified')">
						<view class="checkbox" :class="{ checked: supplierOptions.specified }">
							<text v-if="supplierOptions.specified">√</text>
						</view>
						<text>指定商家</text>
					</view>
				</view>
				<view v-if="supplierOptions.specified" class="supplier-picker" @click="goChooseSupplier">
					<text class="supplier-picker-text" :class="{ placeholder: !selectedSupplierNames.length }">
						{{ selectedSupplierNames.length ? selectedSupplierNames.join('、') : '点击选择商家 >' }}
					</text>
				</view>
			</view>

			<view class="section-card address-card" @click="chooseAddress">
				<view class="address-head">
					<text class="section-title">收货地址</text>
					<text class="address-action">{{ selectedAddress.id ? '更换' : '选择/新增' }} ></text>
				</view>
				<template v-if="selectedAddress.id">
					<text class="contact-line">{{ selectedAddress.realName }} {{ selectedAddress.phone }}</text>
					<text class="address-line">{{ selectedAddressText }}</text>
				</template>
				<text v-else class="address-empty">暂无收货地址，点击选择或填写</text>
			</view>

			<view class="body-spacer"></view>
		</scroll-view>

		<view class="publish-bar">
			<view class="publish-btn" @click="publishInquiry">发布</view>
		</view>
	</view>
</template>

<script>
import { getAddressList } from '@/api/user.js';

const QUALITY_OPTIONS = [
	{ label: '原厂(国内4S)', values: ['ORIGINAL_INLAND_4S'] },
	{ label: '原厂(非国内4S)', values: ['ORIGINAL_CURRENCY'] },
	{ label: '品牌', values: ['BRAND'] },
	{ label: '原厂再制造', values: ['ORIGINAL_OTHERS'] },
	{ label: '拆车件', values: ['SECOND_HAND'] },
	{ label: '其他', values: ['OTHER_BRAND'] }
];

export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			vinCode: 'WVWSR31FXCV012344',
			vehicleName: '车辆信息',
				externalInquiryId: '',
				parts: [],
			decodeRefreshTimer: null,
			isRefreshingDecode: false,
			qualityOptions: QUALITY_OPTIONS,
			selectedQualityLabels: [QUALITY_OPTIONS[0].label],
			selectedQualityValues: QUALITY_OPTIONS[0].values,
			supplierOptions: {
				smart: true,
				specified: false
			},
			selectedSuppliers: [],
			selectedSupplierNames: [],
			selectedAddress: {},
			hasSavedAddress: null
		};
	},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		},
		selectedAddressText() {
			const address = this.selectedAddress || {};
			return [address.province, address.city, address.district, address.detail].filter(Boolean).join(' ');
		},
		selectedQualityLabelsText() {
			return Array.isArray(this.selectedQualityLabels) && this.selectedQualityLabels.length
				? this.selectedQualityLabels.join('、')
				: '';
		},
		selectedSupplierStoreIds() {
			return this.selectedSuppliers
				.map(item => item && item.storeId ? String(item.storeId) : '')
				.filter(Boolean);
		}
	},
	onLoad(options) {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
		this.statusBarHeight = info.statusBarHeight || 20;
		this.navContentHeight = this.getNavContentHeight();

		if (options && options.vin) {
			this.vinCode = decodeURIComponent(options.vin);
		}
		if (options && options.externalInquiryId) {
			this.externalInquiryId = decodeURIComponent(options.externalInquiryId);
		}

		const vehicleInfo = uni.getStorageSync('inquiryVehicleInfo') || {};
		this.vehicleName =
			vehicleInfo.saleModelName ||
			[vehicleInfo.carBrandName, vehicleInfo.seriesZh, vehicleInfo.carModelName]
				.filter(Boolean)
				.join(' ') ||
			'车辆信息';

		this.parts = this.buildParts();
		this.fetchQualitiesList();
	},
	onShow() {
		const selectedSuppliers = uni.getStorageSync('inquirySelectedSuppliers');
		if (selectedSuppliers && selectedSuppliers.length) {
			this.selectedSuppliers = selectedSuppliers;
			this.selectedSupplierNames = selectedSuppliers
				.map(item => item && item.storeName ? item.storeName : '')
				.filter(Boolean);
			uni.removeStorageSync('inquirySelectedSuppliers');
		}

		const selectedAddress = uni.getStorageSync('inquirySelectedAddress');
		if (selectedAddress && selectedAddress.id) {
			this.selectedAddress = selectedAddress;
			uni.removeStorageSync('inquirySelectedAddress');
			this.startDecodeRefresh();
			return;
		}

		if (!this.selectedAddress.id) {
			this.loadDefaultAddress();
		}
		this.startDecodeRefresh();
	},
	onHide() {
		this.stopDecodeRefresh();
	},
	onUnload() {
		this.stopDecodeRefresh();
	},
	methods: {
		getNavContentHeight() {
			let navContentHeight = 44;
			// #ifdef MP-WEIXIN
			const menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
			if (menuButton && menuButton.height) {
				navContentHeight = Math.max(menuButton.height + 12, 44);
			}
			// #endif
			return navContentHeight;
		},
		startDecodeRefresh() {
			this.stopDecodeRefresh();
			this.refreshDecodeList();
			this.decodeRefreshTimer = setInterval(() => {
				this.refreshDecodeList();
			}, 15000);
		},
		stopDecodeRefresh() {
			if (!this.decodeRefreshTimer) return;
			clearInterval(this.decodeRefreshTimer);
			this.decodeRefreshTimer = null;
		},
		buildPartDecodeKey(sourceName, item, index = 0) {
			const code = item
				? (item.oeCode || item.oeCodeTrim || item.stdNameCode || item.oeName || item.stdName || '')
				: '';
			return `${sourceName || ''}__${code || `pending_${index}`}`;
		},
		createPendingPart(sourceName, index = 0, basePart = {}) {
			return {
				id: `${Date.now()}-${index}-${sourceName || 'part'}`,
				sourceName,
				decodeKey: this.buildPartDecodeKey(sourceName, null, index),
				name: sourceName,
				hasDecodedItem: false,
				oeCode: '',
				referencePrice: '',
				quantity: Number(basePart.quantity || 1) || 1,
				remark: basePart.remark || '',
				images: Array.isArray(basePart.images) ? basePart.images.slice() : []
			};
		},
		createDecodedPart(sourceName, item, index = 0, basePart = {}) {
			return {
				id: `${Date.now()}-${index}-${sourceName || 'part'}`,
				sourceName,
				decodeKey: this.buildPartDecodeKey(sourceName, item, index),
				name: (item && (item.oeName || item.stdName)) || sourceName,
				hasDecodedItem: true,
				oeCode: (item && (item.oeCode || item.oeCodeTrim || item.stdNameCode)) || '',
				referencePrice: item && item.priceOf4S != null ? String(item.priceOf4S) : '',
				quantity: Number(basePart.quantity || (item && item.suggestNum) || 1) || 1,
				remark: basePart.remark || '',
				images: Array.isArray(basePart.images) ? basePart.images.slice() : []
			};
		},
		normalizePartsFromDecodeResult(decodeList, existingParts = []) {
			const selectedParts = uni.getStorageSync('inquirySelectedParts') || [];
			const sourcePartMap = existingParts.reduce((map, part) => {
				const key = part.sourceName || part.name;
				if (!map[key]) map[key] = [];
				map[key].push(part);
				return map;
			}, {});
			return selectedParts.flatMap((sourceName, sourceIndex) => {
				const matchedDecode = (Array.isArray(decodeList) ? decodeList : []).find(item => item && item.inputOeName === sourceName);
				const decodedItems = matchedDecode && Array.isArray(matchedDecode.data) ? matchedDecode.data : [];
				const existingGroup = sourcePartMap[sourceName] || [];
				if (!decodedItems.length) {
					const basePart = existingGroup[0] || {};
					return [this.createPendingPart(sourceName, sourceIndex, basePart)];
				}
				return decodedItems.map((item, itemIndex) => {
					const decodeKey = this.buildPartDecodeKey(sourceName, item, itemIndex);
					const exactPart = existingGroup.find(part => part.decodeKey === decodeKey);
					const basePart = exactPart || existingGroup[0] || {};
					return this.createDecodedPart(sourceName, item, itemIndex, basePart);
				});
			});
		},
		buildRefreshDecodePayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			const uid = getters.uid || 0;
			const vehicleInfo = uni.getStorageSync('inquiryVehicleInfo') || {};
			const carBrandName = vehicleInfo.carBrandName || vehicleInfo.brandName || '';
			const carModelName = vehicleInfo.saleModelName || vehicleInfo.carModelName || this.vehicleName || '';
			return {
				userId: Number(uid) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				contactName: this.selectedAddress.realName || userInfo.nickname || '',
				contactNumber: this.selectedAddress.phone || userInfo.phone || '',
				provinceGeoName: this.selectedAddress.province || '',
				cityGeoName: this.selectedAddress.city || '',
				countyGeoName: this.selectedAddress.district || '',
				villageGeoName: this.selectedAddress.street || this.selectedAddress.district || this.selectedAddress.city || '',
				address: this.selectedAddress.detail || '',
				longitude: this.getLongitude(),
				latitude: this.getLatitude(),
				vin: this.vinCode,
				oeList: (uni.getStorageSync('inquirySelectedParts') || []).filter(Boolean),
				carBrandId: String(vehicleInfo.carBrandCode || vehicleInfo.carBrandId || vehicleInfo.brandId || vehicleInfo.levelId || ''),
				carBrandName,
				carModelName,
				openInvoiceType: 'NO',
				quotedType: 'AUTO'
			};
		},
		requestRefreshDecode(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/vin-batchdecode',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		mergePartsWithDecodeResult(list) {
			return this.normalizePartsFromDecodeResult(list, this.parts);
		},
		async refreshDecodeList() {
			if (this.isRefreshingDecode || !this.parts.length || !this.vinCode) return;
			this.isRefreshingDecode = true;
			try {
				const result = await this.requestRefreshDecode(this.buildRefreshDecodePayload());
				if (result && result.msgid && Number(result.msgid) !== 200) return;
				const decodeList = result && result.data ? result.data : [];
				uni.setStorageSync('inquiryBatchDecodeResult', decodeList);
				this.parts = this.mergePartsWithDecodeResult(decodeList);
			} catch (error) {
				// silent polling failure
			} finally {
				this.isRefreshingDecode = false;
			}
		},
		buildParts() {
			const selectedParts = uni.getStorageSync('inquirySelectedParts') || [];
			const decodeResult = uni.getStorageSync('inquiryBatchDecodeResult') || [];
			return this.normalizePartsFromDecodeResult(decodeResult, []);
			const now = Date.now();

			return selectedParts.map((name, index) => {
				const matchedDecode = decodeResult.find(item => item && item.inputOeName === name);
				const firstDecodedItem = matchedDecode && Array.isArray(matchedDecode.data) ? matchedDecode.data[0] : null;
				return {
					id: `${now}-${index}`,
					name: (firstDecodedItem && (firstDecodedItem.oeName || firstDecodedItem.stdName)) || name,
					hasDecodedItem: !!firstDecodedItem,
					oeCode:
						(firstDecodedItem && (firstDecodedItem.oeCode || firstDecodedItem.oeCodeTrim || firstDecodedItem.stdNameCode)) ||
						'',
					referencePrice:
						firstDecodedItem && firstDecodedItem.priceOf4S != null
							? String(firstDecodedItem.priceOf4S)
							: (index === 0 ? '129.54' : '待询价'),
					quantity: firstDecodedItem && firstDecodedItem.suggestNum ? Number(firstDecodedItem.suggestNum) || 1 : 1,
					remark: '',
					images: []
				};
			}).map(part => (
				part.hasDecodedItem
					? part
					: {
						...part,
						oeCode: '',
						referencePrice: ''
					}
			));
		},
		formatPrice(value) {
			if (value === null || value === undefined || value === '') return '待询价';
			return value;
		},
		getDisplayOeCode(part) {
			if (!part || !part.hasDecodedItem) return '等待译码';
			return part.oeCode || '等待译码';
		},
		isUnknownPrice(part) {
			if (!part || !part.hasDecodedItem) return true;
			const value = part.referencePrice;
			if (value === null || value === undefined || value === '') return true;
			return String(value).trim() === '否';
		},
		formatPrice(part) {
			if (this.isUnknownPrice(part)) return '未知';
			return String(part.referencePrice);
		},
		requestQualitiesList() {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/GetQualitiesList',
					method: 'GET',
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		normalizeQualitiesList(list) {
			if (!Array.isArray(list)) return [];
			return list
				.map(item => {
					if (typeof item === 'string') {
						return {
							label: item.trim(),
							values: [item.trim()]
						};
					}
					if (!item || typeof item !== 'object') return null;
					const label = String(
						item.name ||
						item.label ||
						item.text ||
						item.value ||
						item.qualityName ||
						item.quality ||
						item.dictLabel ||
						''
					).trim();
					const values = Array.isArray(item.values)
						? item.values.filter(Boolean).map(value => String(value))
						: (item.value ? [String(item.value)] : []);
					if (!label) return null;
					return {
						label,
						values: values.length ? values : [label]
					};
				})
				.filter(Boolean);
		},
		async fetchQualitiesList() {
			try {
				const result = await this.requestQualitiesList();
				const qualityList = this.normalizeQualitiesList(result && result.data);
				if (!qualityList.length) return;
				this.qualityOptions = qualityList;
				if (!this.selectedQualityLabels.some(label => qualityList.some(item => item.label === label))) {
					this.selectedQualityLabels = [qualityList[0].label];
					this.selectedQualityValues = qualityList[0].values;
				}
			} catch (error) {
				// keep local fallback options
			}
		},
		handleBack() {
			uni.navigateBack({ delta: 1 });
		},
		decreasePart(index) {
			if (this.parts[index] && this.parts[index].quantity > 1) {
				this.parts[index].quantity -= 1;
			}
		},
		increasePart(index) {
			if (this.parts[index]) {
				this.parts[index].quantity += 1;
			}
		},
		removePart(index) {
			this.parts.splice(index, 1);
		},
		handleRemarkInput(index, event) {
			if (this.parts[index]) {
				this.parts[index].remark = event.detail.value;
			}
		},
		isQualitySelected(quality) {
			return this.selectedQualityLabels.includes(quality.label);
		},
		toggleQuality(quality) {
			const qualityValues = Array.isArray(quality.values) ? quality.values : [];
			const labelIndex = this.selectedQualityLabels.indexOf(quality.label);
			if (labelIndex > -1) {
				if (this.selectedQualityLabels.length === 1) return;
				this.selectedQualityLabels.splice(labelIndex, 1);
				this.selectedQualityValues = this.selectedQualityValues.filter(
					value => !qualityValues.includes(value)
				);
				return;
			}
			this.selectedQualityLabels.push(quality.label);
			this.selectedQualityValues = Array.from(
				new Set(this.selectedQualityValues.concat(qualityValues))
			);
		},
		toggleSupplierOption(type) {
			this.supplierOptions[type] = !this.supplierOptions[type];
			if (!this.supplierOptions.smart && !this.supplierOptions.specified) {
				this.supplierOptions.smart = true;
			}
			if (!this.supplierOptions.specified) {
				this.selectedSuppliers = [];
				this.selectedSupplierNames = [];
			}
		},
			goChooseSupplier() {
				uni.setStorageSync('inquirySupplierRequestContext', {
					selectedQualityLabels: this.selectedQualityLabels,
					selectedQualityValues: this.selectedQualityValues,
					selectedAddress: this.selectedAddress
				});
			uni.navigateTo({
				url: `/pages/users/inquiry_merchant/index?selected=${encodeURIComponent(JSON.stringify(this.selectedSuppliers))}`
			});
		},
		loadDefaultAddress() {
			getAddressList({
				page: 1,
				limit: 20,
				status: 1
			})
				.then(res => {
					const list = res && res.data && res.data.list ? res.data.list : [];
					if (!list.length) {
						this.selectedAddress = {};
						this.hasSavedAddress = false;
						return;
					}
					this.hasSavedAddress = true;
					this.selectedAddress = list.find(item => item.isDefault) || list[0];
				})
				.catch(() => {
					this.selectedAddress = {};
					this.hasSavedAddress = null;
				});
		},
		chooseAddress() {
			uni.navigateTo({
				url:
					this.hasSavedAddress === false
						? '/pages/users/user_address/index?selectType=inquiry'
						: '/pages/users/user_address_list/index?selectType=inquiry'
			});
		},
		uploadPartImage(filePath) {
			return new Promise((resolve, reject) => {
				this.$util.uploadImgs(
					filePath,
					{
						url: 'upload/image',
						name: 'multipart',
						model: 'product',
						pid: 1
					},
					res => {
						const imageUrl = res && res.data ? res.data.url : '';
						if (imageUrl) {
							resolve(imageUrl);
							return;
						}
						reject(new Error('empty image url'));
					},
					error => reject(error)
				);
			});
		},
		choosePartImage(index) {
			const part = this.parts[index];
			if (!part) return;
			const remaining = 6 - part.images.length;
			if (remaining <= 0) return;

			uni.chooseImage({
				count: remaining,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async res => {
					const imagePaths = (res.tempFilePaths || []).slice(0, remaining);
					if (!imagePaths.length) return;

					uni.showLoading({
						title: '上传中',
						mask: true
					});

					try {
						const uploadedImages = [];
						for (const filePath of imagePaths) {
							const imageUrl = await this.uploadPartImage(filePath);
							uploadedImages.push(imageUrl);
						}
						const latestImages = this.parts[index].images.concat(uploadedImages).slice(0, 6);
						this.$set(this.parts[index], 'images', latestImages);
					} catch (error) {
						uni.showToast({
							title: '图片上传失败',
							icon: 'none'
						});
					} finally {
						uni.hideLoading();
					}
				}
			});
		},
		removePartImage(partIndex, imageIndex) {
			if (this.parts[partIndex]) {
				this.parts[partIndex].images.splice(imageIndex, 1);
			}
		},
		previewPartImage(images, imageIndex) {
			uni.previewImage({
				current: images[imageIndex],
				urls: images
			});
		},
		getLongitude() {
			return String(
				this.selectedAddress.longitude ||
				this.selectedAddress.longitudeX ||
				uni.getStorageSync('user_longitude') ||
				''
			);
		},
		getLatitude() {
			return String(
				this.selectedAddress.latitude ||
				this.selectedAddress.dimensionY ||
				uni.getStorageSync('user_latitude') ||
				''
			);
		},
		buildInquiryPayload() {
			return {
				vinCode: this.vinCode,
				vehicleName: this.vehicleName,
				externalInquiryId: this.externalInquiryId,
				quality: this.selectedQualityLabelsText,
				qualityValues: this.selectedQualityValues,
				suppliers: {
					smartRecommend: this.supplierOptions.smart,
					specified: this.supplierOptions.specified,
					specifiedNames: this.selectedSupplierNames,
					specifiedStoreIds: this.selectedSupplierStoreIds
				},
				address: {
					id: this.selectedAddress.id || '',
					realName: this.selectedAddress.realName || '',
					phone: this.selectedAddress.phone || '',
					province: this.selectedAddress.province || '',
					city: this.selectedAddress.city || '',
					district: this.selectedAddress.district || '',
					detail: this.selectedAddress.detail || ''
				},
				parts: this.parts.map(part => ({
					name: part.name,
					oeCode: part.oeCode,
					referencePrice: part.referencePrice,
					quantity: part.quantity,
					remark: part.remark,
					images: part.images
				}))
			};
		},
		buildUserNeeds() {
			return this.parts.map(part => ({
				needsName: part.name,
				quantity: Number(part.quantity) || 1,
				oeName: part.name,
				oeCode: part.oeCode || '',
				stdName: part.name,
				stdNameCode: '',
				categoryCode: '',
				imageUrls: Array.isArray(part.images) ? part.images.slice() : [],
				remark: part.remark || ''
			}));
		},
		getQuotedType() {
			const smart = !!this.supplierOptions.smart;
			const specified = !!this.supplierOptions.specified;
			if (smart && specified) return 'COMBINATIONHANDLER';
			if (specified) return 'MANHANDLER';
			return 'SYSTEMHANDLER';
		},
		buildInquiryCreateRequest() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			const uid = getters.uid || 0;
			const vehicleInfo = uni.getStorageSync('inquiryVehicleInfo') || {};
			const carBrandName = vehicleInfo.carBrandName || vehicleInfo.brandName || '';
			const carModelName = vehicleInfo.saleModelName || vehicleInfo.carModelName || this.vehicleName || '';

			return {
				userId: Number(uid) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				contactName: this.selectedAddress.realName || userInfo.nickname || '',
				contactNumber: this.selectedAddress.phone || userInfo.phone || '',
				provinceGeoName: this.selectedAddress.province || '',
				cityGeoName: this.selectedAddress.city || '',
				countyGeoName: this.selectedAddress.district || '',
				villageGeoName: this.selectedAddress.street || this.selectedAddress.district || this.selectedAddress.city || '',
				address: this.selectedAddress.detail || '',
				longitude: this.getLongitude(),
				latitude: this.getLatitude(),
				vin: this.vinCode,
				carBrandId: String(vehicleInfo.carBrandCode || vehicleInfo.carBrandId || vehicleInfo.brandId || vehicleInfo.levelId || ''),
				carBrandName,
				carModelName,
				openInvoiceType: 'NO',
				qualities: this.selectedQualityValues.slice(),
				userNeeds: this.buildUserNeeds(),
				picDemands: [],
				storeIds: this.supplierOptions.specified ? this.selectedSupplierStoreIds : [],
				quotedType: this.getQuotedType()
			};
		},
		buildInquiryAppendRequest() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			const uid = getters.uid || 0;
			return {
				userId: Number(uid) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				externalInquiryId: this.externalInquiryId,
				qualities: this.selectedQualityValues.slice(),
				userNeeds: this.buildUserNeeds(),
				storeIds: this.supplierOptions.specified ? this.selectedSupplierStoreIds : [],
				quotedType: this.getQuotedType()
			};
		},
		requestInquiryCreate(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/inquiry-create',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		requestInquiryAppend(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/inquiry-append',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		async publishInquiry() {
			if (!this.parts.length) {
				uni.showToast({
					title: '请至少保留一个配件',
					icon: 'none'
				});
				return;
			}
			if (!this.selectedAddress.id) {
				uni.showToast({
					title: '请选择收货地址',
					icon: 'none'
				});
				return;
			}
			if (this.supplierOptions.specified && !this.selectedSupplierNames.length) {
				uni.showToast({
					title: '请选择指定商家',
					icon: 'none'
				});
				return;
			}

			const payload = this.buildInquiryPayload();
			uni.setStorageSync('inquiryPublishPayload', payload);
			const hasExternalInquiryId = !!(this.externalInquiryId || '').trim();
			const requestBody = hasExternalInquiryId
				? this.buildInquiryAppendRequest()
				: this.buildInquiryCreateRequest();
			uni.setStorageSync(
				hasExternalInquiryId ? 'latestInquiryAppendRequestBody' : 'latestInquiryCreateRequestBody',
				requestBody
			);
			console.log(
				hasExternalInquiryId ? '[inquiry-append] requestBody' : '[inquiry-create] requestBody',
				JSON.stringify(requestBody)
			);

			uni.showLoading({
				title: '发布中',
				mask: true
			});

			try {
				const result = hasExternalInquiryId
					? await this.requestInquiryAppend(requestBody)
					: await this.requestInquiryCreate(requestBody);
				if (!result || Number(result.msgid) !== 200) {
					uni.showToast({
						title: (result && result.msgtext) || '发布失败',
						icon: 'none'
					});
					return;
				}

				uni.setStorageSync(
					hasExternalInquiryId ? 'latestInquiryAppendResult' : 'latestInquiryCreateResult',
					result.data || {}
				);
				uni.showToast({
					title: '询价发布成功',
					icon: 'success'
				});

				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/users/inquiry_history/index'
					});
				}, 300);
				return;
			} catch (error) {
				uni.showToast({
					title: '发布失败，请稍后重试',
					icon: 'none'
				});
				return;
			} finally {
				uni.hideLoading();
			}
			uni.showToast({
				title: '询价发布成功',
				icon: 'success'
			});
		}
	}
};
</script>

<style scoped lang="scss">
.submit-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f4f4f4;
	overflow: hidden;
}

.nav-shell {
	flex-shrink: 0;
	background: #303030;
}

.nav-row {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 36rpx;
}

.nav-back {
	position: absolute;
	left: 22rpx;
	top: 50%;
	width: 60rpx;
	height: 60rpx;
	transform: translateY(-50%);
}

.nav-back-line {
	position: absolute;
	left: 16rpx;
	width: 4rpx;
	height: 30rpx;
	border-radius: 999rpx;
	background: #ffffff;
	transform-origin: center;
}

.nav-back-line-top {
	top: 10rpx;
	transform: rotate(45deg);
}

.nav-back-line-bottom {
	top: 28rpx;
	transform: rotate(-45deg);
}

.nav-title {
	max-width: 64%;
	font-size: 36rpx;
	font-weight: 500;
	color: #ffffff;
}

.submit-body {
	flex: 1;
	height: 0;
	padding: 20rpx 18rpx 0;
	box-sizing: border-box;
}

.vehicle-card,
.part-card,
.section-card {
	border-radius: 14rpx;
	background: #ffffff;
	box-shadow: 0 7rpx 18rpx rgba(40, 47, 58, 0.04);
}

.vehicle-card {
	padding: 20rpx 24rpx;
}

.vehicle-name {
	display: block;
	font-size: 29rpx;
	font-weight: 600;
	color: #24272d;
}

.vehicle-vin {
	display: block;
	margin-top: 7rpx;
	font-size: 25rpx;
	color: #85898f;
}

.part-card {
	margin-top: 22rpx;
	padding: 24rpx;
	border: 2rpx solid #b9d9ef;
}

.part-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 16rpx;
}

.part-name-wrap {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12rpx;
}

.part-name {
	font-size: 29rpx;
	font-weight: 700;
	color: #24272d;
}

.oe-code {
	padding: 5rpx 10rpx;
	border-radius: 7rpx;
	font-size: 22rpx;
	color: #666b72;
	background: #f0f1f2;
}

.quantity-control {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	column-gap: 10rpx;
}

.quantity-btn,
.quantity,
.delete-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	font-size: 27rpx;
}

.quantity-btn.minus {
	color: #ef6460;
	background: #f6f6f6;
}

.quantity {
	font-size: 31rpx;
	color: #2c2f35;
	background: #f6f6f6;
}

.quantity-btn.plus {
	color: #1387f0;
	background: #edf6ff;
}

.delete-btn {
	width: 54rpx;
	color: #ef6460;
	font-size: 31rpx;
	background: transparent;
}

.part-info {
	margin-top: 20rpx;
}

.info-line {
	display: flex;
	align-items: center;
	margin-bottom: 18rpx;
}

.price-line {
	align-items: center;
	flex-wrap: nowrap;
}

.info-label {
	width: 148rpx;
	flex-shrink: 0;
	font-size: 28rpx;
	color: #6e7279;
	white-space: nowrap;
}

.price-text {
	font-size: 34rpx;
	font-weight: 700;
	color: #e4544d;
}

.price-text.unknown {
	font-size: 30rpx;
	font-weight: 500;
	color: #8a9099;
}

.quality-text {
	padding: 6rpx 14rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	color: #1f7de7;
	background: #eef6ff;
}

.note-line,
.image-line {
	align-items: flex-start;
}

.remark-input {
	flex: 1;
	height: 66rpx;
	padding: 0 18rpx;
	border-radius: 12rpx;
	font-size: 27rpx;
	color: #363a40;
	background: #f5f7fb;
}

.input-placeholder {
	color: #b0b5bc;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.image-item,
.upload-box {
	width: 118rpx;
	height: 118rpx;
	border-radius: 14rpx;
	background: #f7f8fb;
	position: relative;
	overflow: hidden;
}

.part-image {
	width: 100%;
	height: 100%;
}

.image-remove {
	position: absolute;
	top: 6rpx;
	right: 6rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	color: #ffffff;
	background: rgba(0, 0, 0, 0.5);
}

.upload-box {
	border: 2rpx dashed #d8dce5;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.upload-plus {
	font-size: 50rpx;
	line-height: 1;
	color: #1387f0;
}

.upload-count {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #98a0ac;
}

.empty-parts {
	margin-top: 24rpx;
	padding: 34rpx 24rpx;
	border-radius: 14rpx;
	text-align: center;
	font-size: 28rpx;
	color: #9298a0;
	background: #ffffff;
}

.quality-summary,
.supplier-card,
.address-card {
	margin-top: 22rpx;
	padding: 24rpx;
}

.summary-label,
.summary-value,
.section-title {
	font-size: 30rpx;
}

.summary-label {
	color: #555b64;
}

.summary-value {
	margin-left: 20rpx;
	color: #1387f0;
	font-weight: 600;
}

.quality-summary {
	display: flex;
	align-items: center;
}

.quality-options {
	margin-top: 18rpx;
	padding: 22rpx 24rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.quality-chip {
	min-width: 160rpx;
	height: 62rpx;
	padding: 0 18rpx;
	border-radius: 31rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #5b616b;
	background: #f3f5f8;
}

.quality-chip.active {
	color: #ffffff;
	background: linear-gradient(135deg, #2890ff 0%, #0f78ee 100%);
}

.supplier-options {
	display: flex;
	align-items: center;
	column-gap: 48rpx;
	margin-top: 24rpx;
}

.check-option {
	display: flex;
	align-items: center;
	font-size: 31rpx;
	color: #2f3339;
}

.checkbox {
	width: 38rpx;
	height: 38rpx;
	margin-right: 14rpx;
	border: 2rpx solid #d3d8e0;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: transparent;
}

.checkbox.checked {
	color: #ffffff;
	border-color: #1787ef;
	background: #1787ef;
}

.supplier-picker {
	margin-top: 22rpx;
	padding: 22rpx 18rpx;
	border-radius: 12rpx;
	background: #f6f8fb;
}

.supplier-picker-text {
	font-size: 27rpx;
	color: #2f3339;
}

.supplier-picker-text.placeholder {
	color: #a3a9b1;
}

.address-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.address-action {
	font-size: 27rpx;
	color: #959ca6;
}

.contact-line {
	display: block;
	margin-top: 22rpx;
	font-size: 31rpx;
	color: #2d3138;
}

.address-line,
.address-empty {
	display: block;
	margin-top: 12rpx;
	font-size: 27rpx;
	line-height: 1.6;
	color: #767b84;
}

.body-spacer {
	height: 30rpx;
}

.publish-bar {
	flex-shrink: 0;
	padding: 18rpx 18rpx calc(18rpx + env(safe-area-inset-bottom));
	background: #f4f4f4;
}

.publish-btn {
	margin-left: auto;
	width: 220rpx;
	height: 82rpx;
	border-radius: 42rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 34rpx;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #2790ff 0%, #0f78ee 100%);
	box-shadow: 0 12rpx 24rpx rgba(15, 120, 238, 0.22);
}
</style>
