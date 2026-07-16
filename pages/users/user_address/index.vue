<template>
	<view :data-theme="theme">
		<form @submit="formSubmit" report-submit='true'>
			<view class='addAddress pad30'>
				<view class='list borRadius14'>
					<view class='item acea-row row-between-wrapper' style="border: none;">
						<view class='name'>姓名</view>
						<input type='text' placeholder='请输入姓名' placeholder-style="color:#ccc;" name='realName'
							:value="userAddress.realName" placeholder-class='placeholder' maxlength="20"></input>
					</view>
					<view class='item acea-row row-between-wrapper'>
						<view class='name'>联系电话</view>
						<input type='number' placeholder='请输入联系电话' placeholder-style="color:#ccc;" name="phone"
							:value='userAddress.phone' placeholder-class='placeholder' maxlength="11"></input>
					</view>
					<view class='item store-address-item relative' v-if="selectType === 'inquiry'">
						<view class="store-address-top acea-row row-between-wrapper">
							<view class='name'>选择门店地址</view>
							<view class="address" @tap="openStoreSelect">
								<view class='acea-row'>
									<view class="picker line1">{{ selectedStoreName || storeSelectPlaceholder }}</view>
									<view class='iconfont icon-xiangyou abs_right'></view>
								</view>
							</view>
						</view>
						<view class="selected-store-card" v-if="selectedStoreName">
							<view class="selected-store-head">
								<text class="selected-store-name">{{ selectedStore.name || '门店' }}</text>
								<text class="selected-store-distance">{{ formatStoreDistance(selectedStore) }}</text>
							</view>
							<view class="selected-store-address">{{ getStoreAddress(selectedStore) }}</view>
						</view>
					</view>
					<view class='item acea-row row-between-wrapper relative'>
						<view class='name'>所在地区</view>
						<view class="address">
							<view class='acea-row'>
								<view class="picker line1">{{region[0]}}，{{region[1]}}，{{region[2]}}</view>
							</view>
						</view>
					</view>
					<view class='item acea-row row-between-wrapper relative'>
						<view class='name'>详细地址</view>
						<view class="detail-text" :class="{ placeholder: !userAddress.detail }">
							{{ userAddress.detail || (selectType === 'inquiry' ? '请先选择门店地址' : '请点击右侧地图选择地址') }}
						</view>
						<view v-if="selectType !== 'inquiry'" class='iconfont icon-dizhi font_color abs_right' @tap="chooseLocation"></view>
					</view>
				</view>
				<view class='default acea-row row-middle borRadius14'>
					<checkbox-group @change='ChangeIsDefault'>
						<checkbox :checked="userAddress.isDefault" />设置为默认地址
					</checkbox-group>
				</view>

				<button class='keepBnt bg_color' form-type="submit">立即保存</button>
				<!-- #ifdef MP -->
				<view class="wechatAddress" v-if="!id && selectType !== 'inquiry'" @click="getWxAddress">导入微信地址</view>
				<!-- #endif -->
				<!-- #ifdef H5 -->
				<view class="wechatAddress" v-if="this.$wechat.isWeixin() && !id && selectType !== 'inquiry'" @click="getAddress">导入微信地址</view>
				<!-- #endif -->
			</view>
		</form>
		<view class="store-select-mask" v-if="storeSelectVisible">
			<view class="store-select-panel">
				<view class="store-select-header">
					<text class="store-select-cancel" @tap="closeStoreSelect">取消</text>
					<text class="store-select-title">选择门店地址</text>
					<text class="store-select-refresh" @tap="refreshStoreList">刷新</text>
				</view>
				<view class="store-search-box">
					<input
						class="store-search-input"
						v-model="storeKeywords"
						confirm-type="search"
						placeholder="搜索门店名称/地址"
						placeholder-class="placeholder"
						@confirm="searchStoreList"
					/>
					<text class="store-search-btn" @tap="searchStoreList">搜索</text>
				</view>
				<scroll-view class="store-select-list" scroll-y>
					<view class="store-select-loading" v-if="storeLoading">门店加载中...</view>
					<view class="store-select-empty" v-else-if="!storeList.length">暂无门店，请先授权定位</view>
					<view
						class="store-select-row"
						:class="{ active: selectedStoreKey && selectedStoreKey === getStoreKey(item, index) }"
						v-for="(item, index) in storeList"
						:key="getStoreKey(item, index)"
						:data-index="index"
						@tap="handleStoreListTap"
						@click="handleStoreListTap"
						hover-class="store-select-row-hover"
					>
						<view class="store-select-row-head" :data-index="index">
							<view class="store-select-row-title" :data-index="index">
								<text class="store-select-row-name" :data-index="index">{{ item.name || '未命名门店' }}</text>
								<text class="store-select-row-distance" :data-index="index">{{ formatStoreDistance(item) }}</text>
							</view>
						</view>
						<view class="store-select-row-address" :data-index="index">{{ getStoreAddress(item) || '-' }}</view>
					</view>
				</scroll-view>
			</view>
		</view>
		<view v-show="showLoading" class="bg-fixed"></view>
	</view>
</template>

<script>
	import {
		editAddress,
		getAddressDetail
	} from '@/api/user.js';
	import {
		getCityList
	} from "@/utils";
	import {
		getCity
	} from '@/api/api.js';
	import {
		adminStoreListApi
	} from '@/api/store.js';
	import {
		toLogin
	} from '@/libs/login.js';
	import {
		mapGetters
	} from "vuex";
	import {
		Debounce
	} from '@/utils/validate.js'
	import atModel from '@/pages/users/components/accredit/index.vue'
	// import atModel from '@/components/accredit/index.vue'
	let app = getApp();
	export default {
		components: {
			atModel
		},
		data() {
			return {
				cartId: '', //璐墿杞d
				pinkId: 0, //鎷煎洟id
				couponId: 0, //浼樻儬鍒竔d
				id: 0, //鍦板潃id
				userAddress: {
					isDefault: false
				}, //鍦板潃璇︽儏
				region: ['省', '市', '区'],
				valueRegion: [0, 0, 0],
				district: [],
				multiArray: [],
				multiIndex: [0, 0, 0],
				cityId: 0,
				bargain: false, //鏄惁鏄爫浠?
				combination: false, //鏄惁鏄嫾鍥?
				secKill: false, //鏄惁鏄鏉€
				theme: app.globalData.theme,
				showLoading: false,
				selectType: '',
				storeList: [],
				storeLoading: false,
				storeSelectVisible: false,
				storeKeywords: '',
				selectedStore: {},
				selectedStoreIndex: 0,
				selectingStore: false,
				lastStoreTapTime: 0,
				userLatitude: '',
				userLongitude: ''
			};
		},
		computed: {
			...mapGetters(['isLogin']),
			storeSelectPlaceholder() {
				if (this.storeLoading) return '门店加载中...';
				return '请选择门店地址';
			},
			selectedStoreName() {
				return this.selectedStore && Object.keys(this.selectedStore).length ? (this.selectedStore.name || '门店') : '';
			},
			selectedStoreKey() {
				return this.selectedStore && Object.keys(this.selectedStore).length ? this.getStoreKey(this.selectedStore, this.selectedStoreIndex) : '';
			}
		},
		watch: {
			isLogin: {
				handler: function(newV, oldV) {
					if (newV) {
						this.getUserAddress();
					}
				},
				deep: true
			}
		},
		onLoad(options) {
			this.selectType = options.selectType || '';
			if (this.$Cache.getItem('cityList')) {
				//妫€娴嬪煄甯傛暟鎹紦瀛樻槸鍚﹁繃鏈燂紝鏈夌殑璇濅粠缂撳瓨鍙栵紝娌℃湁鐨勮瘽璇锋眰鎺ュ彛
				this.district = this.$Cache.getItem('cityList');
				this.initialize();
			} else {
				this.showLoading = true;
				uni.showLoading({
					title: '数据加载中...'
				});
				getCityList().then(res=>{
					this.district = res
					this.initialize();
					uni.hideLoading();
					this.showLoading = false;
				})
			}
			if (this.isLogin) {
				this.preOrderNo = options.preOrderNo || 0;
				this.id = options.id || 0;
				uni.setNavigationBarTitle({
					title: options.id ? '修改地址' : '添加地址'
				})
				this.getUserAddress();
				if (this.selectType === 'inquiry') this.initInquiryLocationAndStores();
			} else {
				toLogin();
			}
		},
		methods: {
			initInquiryLocationAndStores() {
				this.requestLocationForStores();
			},
			requestLocationForStores() {
				uni.getLocation({
					type: 'wgs84',
					success: (res) => {
						this.userLatitude = res.latitude || '';
						this.userLongitude = res.longitude || '';
						uni.setStorageSync('user_latitude', this.userLatitude);
						uni.setStorageSync('user_longitude', this.userLongitude);
						this.loadStoreList();
					},
					fail: () => {
						uni.showModal({
							title: '需要定位授权',
							content: '请允许获取地理位置，用于查询附近门店地址',
							confirmText: '去授权',
							success: (modalRes) => {
								if (!modalRes.confirm) return;
								uni.openSetting({
									success: () => this.requestLocationForStores()
								});
							}
						});
					}
				});
			},
			ensureInquiryStoreList() {
				if (this.selectType !== 'inquiry') return;
				if (this.storeList.length || this.storeLoading) return;
				this.requestLocationForStores();
			},
			openStoreSelect() {
				if (this.selectType !== 'inquiry') return;
				this.storeSelectVisible = true;
				this.ensureInquiryStoreList();
			},
			closeStoreSelect() {
				this.storeSelectVisible = false;
			},
			refreshStoreList() {
				this.storeList = [];
				this.storeKeywords = '';
				this.loadStoreList();
			},
			searchStoreList() {
				this.storeList = [];
				this.loadStoreList();
			},
			tipsAndOpenStoreSelect(title = '请选择门店地址') {
				this.$util.Tips({
					title
				});
				setTimeout(() => {
					this.openStoreSelect();
				}, 500);
			},
			handleStoreListTap(e) {
				const currentDataset = (e && e.currentTarget && e.currentTarget.dataset) || {};
				const dataset = (e && e.target && e.target.dataset) || {};
				const indexValue = currentDataset.index !== undefined ? currentDataset.index : dataset.index;
				if (indexValue === undefined || indexValue === null || indexValue === '') return;
				const index = Number(indexValue);
				if (Number.isNaN(index) || !this.storeList[index]) return;
				const now = Date.now();
				if (now - this.lastStoreTapTime < 350) return;
				this.lastStoreTapTime = now;
				this.selectStore(this.storeList[index], index);
			},
			selectStore(store, index) {
				if (!store) return;
				console.log('选择门店', index, store);
				const selectedStore = Object.assign({}, store);
				this.selectedStoreIndex = index;
				this.selectedStore = selectedStore;
				try {
					this.applyStoreAddress(selectedStore);
				} catch (e) {
					console.log('select store failed', e);
				}
				this.$nextTick(() => {
					this.closeStoreSelect();
					this.selectingStore = false;
					this.$forceUpdate && this.$forceUpdate();
				});
			},
			loadStoreList() {
				if (this.storeLoading) return;
				this.storeLoading = true;
				adminStoreListApi({
					isDelete: 0,
					keywords: String(this.storeKeywords || '').trim(),
					page: 1,
					limit: 10000
				}).then(res => {
					const list = res && res.data && res.data.list ? res.data.list : [];
					this.storeList = list.slice().sort((a, b) => this.getStoreDistanceKm(a) - this.getStoreDistanceKm(b));
				}).catch(() => {
					this.storeList = [];
					uni.showToast({
						title: '门店加载失败',
						icon: 'none'
					});
				}).finally(() => {
					this.storeLoading = false;
				});
			},
			applyStoreAddress(store = {}) {
				const storeAddress = this.getStoreAddress(store);
				let matchedRegion = this.getStoreRegion(store);
				try {
					matchedRegion = this.isCompleteRegion(matchedRegion) ? matchedRegion : null;
					const textRegion = this.matchRegionByText(storeAddress);
					matchedRegion = matchedRegion || (this.isCompleteRegion(textRegion) ? textRegion : this.parseRegionFromAddressText(storeAddress));
				} catch (e) {
					matchedRegion = null;
				}
				const regionParts = this.isCompleteRegion(matchedRegion) ? matchedRegion.region : [];
				const storeDetail = this.removeRegionPrefix(storeAddress, regionParts);
				const nextAddress = Object.assign({}, this.userAddress, {
					detail: storeDetail || storeAddress || store.detailedAddress || store.address || '',
					street: storeAddress,
					latitude: store.dimensionY || store.latitude || '',
					longitude: store.longitudeX || store.longitude || '',
					storeId: store.id || store.shopid || store.storeId || '',
					storeName: store.name || store.storeName || ''
				});
				if (matchedRegion && matchedRegion.region.filter(Boolean).length === 3) {
					try {
						this.region = matchedRegion.region.slice();
						this.cityId = matchedRegion.cityId || 0;
						nextAddress.province = matchedRegion.region[0] || '';
						nextAddress.city = matchedRegion.region[1] || '';
						nextAddress.district = matchedRegion.region[2] || '';
						nextAddress.cityId = this.cityId;
						this.valueRegion = [0, 0, 0];
						this.multiIndex = [0, 0, 0];
						this.initialize();
					} catch (e) {}
				}
				this.userAddress = nextAddress;
			},
			isCompleteRegion(match = null) {
				return !!(match && Array.isArray(match.region) && match.region.filter(Boolean).length === 3);
			},
			getStoreRegion(store = {}) {
				const province = this.pickStoreField(store, ['province', 'provinceName', 'province_name']);
				const city = this.pickStoreField(store, ['city', 'cityName', 'city_name']);
				const district = this.pickStoreField(store, ['district', 'districtName', 'area', 'areaName', 'district_name']);
				if (province && city && district) {
					return {
						region: [province, city, district],
						cityId: store.cityId || store.city_id || 0
					};
				}
				return null;
			},
			removeRegionPrefix(address = '', region = []) {
				let detail = String(address || '').trim();
				if (!detail || !Array.isArray(region) || !region.length) return detail;
				region.filter(Boolean).forEach(item => {
					const text = String(item || '').trim();
					if (!text) return;
					if (detail.indexOf(text) === 0) {
						detail = detail.slice(text.length).trim();
					}
				});
				return detail.replace(/^[\s,，、-]+/, '').trim();
			},
			pickStoreField(store = {}, keys = []) {
				for (let i = 0; i < keys.length; i++) {
					const value = store[keys[i]];
					if (value !== undefined && value !== null && String(value).trim()) {
						return String(value).trim();
					}
				}
				return '';
			},
			parseRegionFromAddressText(text = '') {
				const sourceText = String(text || '').trim();
				if (!sourceText) return null;
				const provinceMatch = sourceText.match(/^(.*?(?:省|自治区|北京市|上海市|天津市|重庆市|香港特别行政区|澳门特别行政区))/);
				const province = provinceMatch ? provinceMatch[1] : '';
				const restAfterProvince = province ? sourceText.slice(province.length) : sourceText;
				const cityMatch = restAfterProvince.match(/^(.*?(?:市|自治州|地区|盟))/);
				const city = cityMatch ? cityMatch[1] : '';
				const restAfterCity = city ? restAfterProvince.slice(city.length) : restAfterProvince;
				const districtMatch = restAfterCity.match(/^(.*?(?:区|县|市|旗))/);
				const district = districtMatch ? districtMatch[1] : '';
				if (province && city && district) {
					return {
						region: [province, city, district],
						cityId: 0
					};
				}
				return null;
			},
			getStoreAddress(store = {}) {
				const addressList = [
					store.address,
					store.storeAddress,
					store.addr,
					store.fullAddress,
					store.locationAddress,
					store.detailedAddress,
					store.detailAddress,
					store.detail
				].filter(item => item !== undefined && item !== null && String(item).trim())
					.map(item => String(item).trim());
				return Array.from(new Set(addressList)).join(' ');
			},
			getStoreKey(store = {}, index = 0) {
				return String(store.id || store.shopid || store.storeId || store.storeCode || store.name || index);
			},
			isValidCoordinate(latitude, longitude) {
				const lat = Number(latitude);
				const lng = Number(longitude);
				if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
				return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
			},
			toRadians(value) {
				return Number(value) * Math.PI / 180;
			},
			getDistanceKm(lat1, lng1, lat2, lng2) {
				const earthRadius = 6371;
				const dLat = this.toRadians(lat2 - lat1);
				const dLng = this.toRadians(lng2 - lng1);
				const a =
					Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(this.toRadians(lat1)) *
						Math.cos(this.toRadians(lat2)) *
						Math.sin(dLng / 2) *
						Math.sin(dLng / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				return earthRadius * c;
			},
			getStoreDistanceKm(store = {}) {
				const storeLatitude = Number(store.dimensionY || store.latitude);
				const storeLongitude = Number(store.longitudeX || store.longitude);
				const userLatitude = Number(this.userLatitude || uni.getStorageSync('user_latitude'));
				const userLongitude = Number(this.userLongitude || uni.getStorageSync('user_longitude'));
				if (
					this.isValidCoordinate(storeLatitude, storeLongitude) &&
					this.isValidCoordinate(userLatitude, userLongitude)
				) {
					const km = this.getDistanceKm(userLatitude, userLongitude, storeLatitude, storeLongitude);
					if (!Number.isNaN(km) && km >= 0) return km;
				}
				const distance = Number(store.distance);
				if (!Number.isNaN(distance) && distance > 0) return distance / 1000;
				return Number.MAX_SAFE_INTEGER;
			},
			formatStoreDistance(store = {}) {
				const km = this.getStoreDistanceKm(store);
				if (km === Number.MAX_SAFE_INTEGER) return '';
				return `距离${km.toFixed(2)}km`;
			},
			normalizeRegionName(name = '') {
				return String(name || '').trim();
			},
			matchRegionByText(text = '') {
				const sourceText = String(text || '').trim();
				if (!sourceText || !Array.isArray(this.district) || !this.district.length) {
					return null;
				}

				for (let i = 0; i < this.district.length; i++) {
					const province = this.district[i];
					const provinceName = this.normalizeRegionName(province && province.name);
					if (!provinceName || sourceText.indexOf(provinceName) === -1) continue;

					const cityList = Array.isArray(province.child) ? province.child : [];
					for (let j = 0; j < cityList.length; j++) {
						const city = cityList[j];
						const cityName = this.normalizeRegionName(city && city.name);
						if (!cityName || sourceText.indexOf(cityName) === -1) continue;

						const areaList = Array.isArray(city.child) ? city.child : [];
						for (let k = 0; k < areaList.length; k++) {
							const area = areaList[k];
							const areaName = this.normalizeRegionName(area && area.name);
							if (!areaName || sourceText.indexOf(areaName) === -1) continue;

							return {
								region: [provinceName, cityName, areaName],
								cityId: area.cityId || 0
							};
						}

						return {
							region: [provinceName, cityName, this.region[2] === '区' ? '' : this.region[2]],
							cityId: 0
						};
					}
				}

				return null;
			},
			applyLocationResult(locationRes = {}) {
				console.log('[添加地址-地图] applyLocationResult', locationRes);
				const latitude = locationRes.latitude || '';
				const longitude = locationRes.longitude || '';
				const name = String(locationRes.name || '').trim();
				const address = String(locationRes.address || '').trim();
				const matchedRegion = this.matchRegionByText(address) || this.matchRegionByText(name);

				this.$set(this.userAddress, 'detail', name || address);
				this.$set(this.userAddress, 'latitude', latitude);
				this.$set(this.userAddress, 'longitude', longitude);
				this.$set(this.userAddress, 'street', address);

				if (matchedRegion && matchedRegion.region.filter(Boolean).length === 3) {
					this.region = matchedRegion.region;
					this.cityId = matchedRegion.cityId || 0;
					this.valueRegion = [0, 0, 0];
					this.multiIndex = [0, 0, 0];
					this.initialize();
				}
			},
			// #ifdef APP-PLUS
			// 鑾峰彇閫夋嫨鐨勫湴鍖?
			handleGetRegion(region) {
				this.region = region
			},
			// #endif
			getUserAddress: function() {
				if (!this.id) return false;
				let that = this;
				getAddressDetail(this.id).then(res => {
					if(res.data){
						let region = [res.data.province, res.data.city, res.data.district];
						that.$set(that, 'userAddress', res.data);
						that.$set(that, 'region', region);
						that.cityId = res.data.cityId || 0;
					}
				});
			},
			initialize: function() {
				let that = this,province = [],city = [],area = [];
				if (that.district.length) {
					let cityChildren = that.district[0].child || [];
					let areaChildren = cityChildren.length ? (cityChildren[0].child || []) : [];
					that.district.forEach(function(item,i) {
						province.push(item.name);
						if (item.name === that.region[0]) {
							that.valueRegion[0] = i
							that.multiIndex[0] = i
						}
					});
					that.district[this.valueRegion[0]].child.forEach((item,i)=>{
						city.push(item.name);
						if (that.region[1] == item.name) {
							that.valueRegion[1] = i
							that.multiIndex[1] = i
						}
					})
					that.district[this.valueRegion[0]].child[this.valueRegion[1]].child.forEach((item,i)=>{
						area.push(item.name);
						if (that.region[2] == item.name) {
							that.valueRegion[2] = i
							that.multiIndex[2] = i
						}
					})
					this.multiArray = [province, city, area]
				}
			},
			bindRegionChange: function(e) {
				let multiIndex = this.multiIndex,
					province = this.district[multiIndex[0]] || {
						child: []
					},
					city = province.child[multiIndex[1]] || {
						child: []
					},
					area = city.child[multiIndex[2]] || {
						cityId: 0
					},
					multiArray = this.multiArray,
					value = e.detail.value;
				this.region = [multiArray[0][value[0]], multiArray[1][value[1]], multiArray[2][value[2]]]
				this.cityId = area.cityId;
				this.valueRegion = [0, 0, 0]
				this.initialize();
			},
			bindMultiPickerColumnChange: function(e) {
				let that = this,
					column = e.detail.column,
					value = e.detail.value,
					currentCity = this.district[value] || {
						child: []
					},
					multiArray = that.multiArray,
					multiIndex = that.multiIndex;
				multiIndex[column] = value;
				switch (column) {
					case 0:
						let areaList = currentCity.child[0] || {
							child: []
						};
						multiArray[1] = currentCity.child.map((item) => {
							return item.name;
						});
						multiArray[2] = areaList.child.map((item) => {
							return item.name;
						});
						break;
					case 1:
						let cityList = that.district[multiIndex[0]].child[multiIndex[1]].child || [];
						multiArray[2] = cityList.map((item) => {
							return item.name;
						});
						break;
					case 2:

						break;
				}
				// #ifdef MP || APP-PLUS
				this.$set(this.multiArray, 0, multiArray[0]);
				this.$set(this.multiArray, 1, multiArray[1]);
				this.$set(this.multiArray, 2, multiArray[2]);
				// #endif
				// #ifdef H5
				this.multiArray = multiArray;
				// #endif
				this.multiIndex = multiIndex
				// this.setData({ multiArray: multiArray, multiIndex: multiIndex});
			},
			toggleTab(str) {
				this.$refs[str].show();
			},
			onConfirm(val) {
				this.region = val.checkArr[0] + '-' + val.checkArr[1] + '-' + val.checkArr[2];
			},
			//閫夋嫨鍦颁綅鍦板潃
			chooseLocation: function() {
				console.log('[添加地址-地图] 点击地图选择', {
					selectType: this.selectType,
					id: this.id,
					cachedLatitude: uni.getStorageSync('user_latitude'),
					cachedLongitude: uni.getStorageSync('user_longitude')
				});
				this.$util.$L.getLocation().then(res=>{
					console.log('[添加地址-地图] getLocation success', {
						res,
						cachedLatitude: uni.getStorageSync('user_latitude'),
						cachedLongitude: uni.getStorageSync('user_longitude')
					});
					const locationOptions = {
						latitude: uni.getStorageSync('user_latitude'),
						longitude: uni.getStorageSync('user_longitude'),
						success: (res) => {
							console.log('[添加地址-地图] chooseLocation success', res);
							this.applyLocationResult(res);
						},
						fail: (err) => {
							console.log('[添加地址-地图] chooseLocation fail', err);
						},
						complete: (res) => {
							console.log('[添加地址-地图] chooseLocation complete', res);
						}
					};
					// #ifdef MP-WEIXIN
					console.log('[添加地址-地图] 调用 wx.chooseLocation', locationOptions);
					wx.chooseLocation(locationOptions);
					// #endif
					// #ifndef MP-WEIXIN
					console.log('[添加地址-地图] 调用 uni.chooseLocation', locationOptions);
					uni.chooseLocation(locationOptions);
					// #endif
				}).catch(err => {
					console.log('[添加地址-地图] getLocation fail', err);
				})
			},
			// 瀵煎叆鍏变韩鍦板潃锛堝皬绋嬪簭锛?
			getWxAddress: function() {
				let that = this;
				uni.authorize({
					scope: 'scope.address',
					success: function(res) {
						uni.chooseAddress({
							success: function(res) {
								let addressP = {};
								addressP.province = res.provinceName;
								addressP.city = res.cityName;
								addressP.district = res.countyName;
								addressP.cityId = 0;
								editAddress({
									address: addressP,
									isDefault: 1,
									realName: res.userName,
									postCode: res.postalCode,
									phone: res.telNumber,
									detail: res.detailInfo,
									id: 0,
									status: that.selectType === 'inquiry' ? 1 : 0
								}).then(apiRes => {
									if (that.selectType === 'inquiry') {
										uni.setStorageSync('inquirySelectedAddress', {
											id: apiRes && apiRes.data ? apiRes.data.id : '',
											realName: res.userName,
											phone: res.telNumber,
											province: addressP.province,
											city: addressP.city,
											district: addressP.district,
											detail: res.detailInfo,
											isDefault: true
										});
									}
									setTimeout(function() {
										if (that.cartId) {
											let cartId = that.cartId;
											let pinkId = that.pinkId;
											let couponId = that.couponId;
											that.cartId = '';
											that.pinkId = '';
											that.couponId = '';
											uni.navigateTo({
												url: '/pages/order/order_confirm/index?cartId=' +
													cartId +
													'&addressId=' + (
														that.id ? that
														.id :
														apiRes.data
														.id) +
													'&pinkId=' +
													pinkId +
													'&couponId=' +
													couponId +
													'&secKill=' + that
													.secKill +
													'&combination=' +
													that.combination +
													'&bargain=' + that
													.bargain
											});
										} else if (that.selectType === 'inquiry') {
											uni.navigateBack({
												delta: 1
											});
										} else {
											uni.navigateBack({
												delta: 1
											});
										}
									}, 1000);
									return that.$util.Tips({
										title: "娣诲姞鎴愬姛",
										icon: 'success'
									});
								}).catch(err => {
									return that.$util.Tips({
										title: err
									});
								});
							},
							fail: function(res) {
								if (res.errMsg == 'chooseAddress:cancel') return that.$util
									.Tips({
										title: '鍙栨秷閫夋嫨'
									});
							},
						})
					},
					fail: function(res) {
						uni.showModal({
							title: '鎮ㄥ凡鎷掔粷瀵煎叆寰俊鍦板潃鏉冮檺',
							content: '鏄惁杩涘叆鏉冮檺绠＄悊锛岃皟鏁存巿鏉冿紵',
							success(res) {
								if (res.confirm) {
									uni.openSetting({
										success: function(res) {}
									});
								} else if (res.cancel) {
									return that.$util.Tips({
										title: '宸插彇娑堬紒'
									});
								}
							}
						})
					},
				})
			},
			// 瀵煎叆鍏变韩鍦板潃锛堝井淇★級锛?
			getAddress() {
				let that = this;
				that.$wechat.openAddress().then(userInfo => {
					// open();
					editAddress({
							id: this.id,
							realName: userInfo.userName,
							phone: userInfo.telNumber,
							address: {
								province: userInfo.provinceName,
								city: userInfo.cityName,
								district: userInfo.countryName,
								cityId: 0
							},
							detail: userInfo.detailInfo,
							isDefault: 1,
							postCode: userInfo.postalCode,
							status: that.selectType === 'inquiry' ? 1 : 0
						})
						.then((res) => {
							if (that.selectType === 'inquiry') {
								uni.setStorageSync('inquirySelectedAddress', {
									id: that.id || (res && res.data ? res.data.id : ''),
									realName: userInfo.userName,
									phone: userInfo.telNumber,
									province: userInfo.provinceName,
									city: userInfo.cityName,
									district: userInfo.countryName,
									detail: userInfo.detailInfo,
									isDefault: true
								});
							}
							setTimeout(function() {
								if (that.cartId) {
									let cartId = that.cartId;
									let pinkId = that.pinkId;
									let couponId = that.couponId;
									that.cartId = '';
									that.pinkId = '';
									that.couponId = '';
									uni.navigateTo({
										url: '/pages/order/order_confirm/index?cartId=' +
											cartId + '&addressId=' + (that.id ? that.id :
												res.data
												.id) + '&pinkId=' + pinkId + '&couponId=' +
											couponId + '&secKill=' + that.secKill +
											'&combination=' + that.combination + '&bargain=' +
											that.bargain
									});
								} else if (that.selectType === 'inquiry') {
									uni.navigateBack({
										delta: 1
									});
								} else {
									uni.navigateTo({
										url: '/pages/users/user_address_list/index'
									})
									// history.back();
								}
							}, 1000);
							// close();
							that.$util.Tips({
								title: "娣诲姞鎴愬姛",
								icon: 'success'
							});
						})
						.catch(err => {
							// close();
							return that.$util.Tips({
								title: err || "娣诲姞澶辫触"
							});
						});
				}).catch(err => {
					console.log(err);
				});
			},
			/**
			 * 鎻愪氦鐢ㄦ埛娣诲姞鍦板潃
			 * 
			 */
			formSubmit: Debounce(function(e) {
				let that = this,
					value = e.detail.value;
				value.detail = that.userAddress.detail || '';
				if (!value.realName) return that.$util.Tips({
					title: '请填写收货人姓名'
				});
				if (!value.phone) return that.$util.Tips({
					title: '请填写联系电话'
				});
				if (!/^1(3|4|5|7|8|9|6)\d{9}$/i.test(value.phone)) return that.$util.Tips({
					title: '请输入正确的手机号码'
				});
				if (that.region.join('-') == '省-市-区') {
					if (that.selectType === 'inquiry') return that.tipsAndOpenStoreSelect();
					return that.$util.Tips({
						title: '请点击地图选择地址'
					});
				}
				if (!value.detail) {
					if (that.selectType === 'inquiry') return that.tipsAndOpenStoreSelect();
					return that.$util.Tips({
						title: '请点击地图选择详细地址'
					});
				}
				if (!that.userAddress.longitude || !that.userAddress.latitude) {
					if (that.selectType === 'inquiry') return that.tipsAndOpenStoreSelect();
					return that.$util.Tips({
						title: '请点击地图选择地址后再保存'
					});
				}
				value.id = that.id;
				let regionArray = that.region;
				value.address = {
					province: regionArray[0],
					city: regionArray[1],
					district: regionArray[2],
					cityId: that.cityId,
				};
				value.isDefault = that.userAddress.isDefault;
				value.status = that.selectType === 'inquiry' ? 1 : 0;
				value.storeId = that.userAddress.storeId || (that.selectedStore ? (that.selectedStore.id || that.selectedStore.shopid || that.selectedStore.storeId || '') : '');
				value.storeName = that.userAddress.storeName || '';

				uni.showLoading({
					title: '保存中',
					mask: true
				})
				value.longitude = that.userAddress.longitude || '';
				value.latitude = that.userAddress.latitude || '';
				editAddress(value).then(res => {
					if (that.selectType === 'inquiry') {
						uni.setStorageSync('inquirySelectedAddress', {
							id: that.id || (res && res.data ? res.data.id : ''),
							realName: value.realName,
							phone: value.phone,
							province: value.address.province,
							city: value.address.city,
							district: value.address.district,
							detail: value.detail,
							isDefault: value.isDefault,
							street: that.userAddress.street || '',
							longitude: value.longitude,
							latitude: value.latitude,
							storeId: that.userAddress.storeId || (that.selectedStore ? (that.selectedStore.id || that.selectedStore.shopid || that.selectedStore.storeId || '') : ''),
							storeName: that.userAddress.storeName || ''
						});
					}
					uni.hideLoading();
					if (that.id)
						that.$util.Tips({
							title: '修改成功',
							icon: 'success'
						});
					else
						that.$util.Tips({
							title: '添加成功',
							icon: 'success'
						});
					setTimeout(function() {
						if (that.preOrderNo > 0) {
							uni.redirectTo({
								url: '/pages/order/order_confirm/index?preOrderNo=' + that
									.preOrderNo + '&addressId=' + (that.id ? that.id : res
										.data.id)
							})
						} else {
							// #ifdef H5
							return history.back();
							// #endif
							// #ifndef H5
							return uni.navigateBack({
								delta: 1,
							})
							// #endif
						}
					}, 1000);
				}).catch(err => {
					uni.hideLoading();
					return that.$util.Tips({
						title: (err && err.message) || err || '保存失败'
					});
				})
			}),
			ChangeIsDefault: function(e) {
				this.$set(this.userAddress, 'isDefault', !this.userAddress.isDefault);
			}
		}
	}
</script>

<style scoped lang="scss">
	.bg-fixed{
		width: 100%;
		height: 750rpx;
		position: absolute;
		top: 0;
	}
	.addAddress {
		padding-top: 20rpx;
	}

	.bg_color {
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
	}

	.addAddress .list {
		background-color: #fff;
		padding: 0 24rpx;
	}

	.addAddress .list .item {
		border-top: 1rpx solid #eee;
		height: 90rpx;
		line-height: 90rpx;
	}

	.addAddress .list .store-address-item {
		height: auto;
		line-height: normal;
		display: block;
		padding-bottom: 0;
	}

	.addAddress .list .store-address-top {
		position: relative;
		height: 90rpx;
		line-height: 90rpx;
	}

	.addAddress .list .item .name {
		width: 200rpx;
		flex-shrink: 0;
		font-size: 30rpx;
		color: #333;
		white-space: nowrap;
	}

	.addAddress .list .item .address {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.addAddress .list .item input {
		flex: 1;
		width: auto;
		min-width: 0;
		margin-left: 20rpx;
		font-size: 30rpx;
		font-weight: 400;
	}

	.addAddress .list .item .detail-text {
		flex: 1;
		width: auto;
		min-width: 0;
		margin-left: 20rpx;
		padding-right: 44rpx;
		font-size: 30rpx;
		font-weight: 400;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		box-sizing: border-box;
	}

	.addAddress .list .item .placeholder {
		color: #ccc;
	}

	.addAddress .list .item picker .picker {
		width: 410rpx;
		font-size: 30rpx;
	}

	.addAddress .selected-store-card {
		margin: 0 0 18rpx 0;
		padding: 20rpx 24rpx;
		background: #f7faff;
		border-radius: 18rpx;
		border: 1rpx solid #e3edff;
	}

	.addAddress .selected-store-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10rpx;
	}

	.addAddress .selected-store-name {
		max-width: 430rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #111827;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.addAddress .selected-store-distance {
		font-size: 24rpx;
		color: #2563eb;
	}

	.addAddress .selected-store-address {
		font-size: 24rpx;
		line-height: 36rpx;
		color: #6b7280;
	}

	.store-select-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: flex-end;
	}

	.store-select-panel {
		width: 100%;
		max-height: 72vh;
		background: #fff;
		border-radius: 28rpx 28rpx 0 0;
		overflow: hidden;
	}

	.store-select-header {
		height: 96rpx;
		padding: 0 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1rpx solid #edf0f5;
		box-sizing: border-box;
	}

	.store-select-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #111827;
	}

	.store-select-cancel,
	.store-select-refresh {
		font-size: 28rpx;
		color: #2563eb;
	}

	.store-search-box {
		display: flex;
		align-items: center;
		margin: 18rpx 30rpx;
		padding: 0 20rpx;
		height: 72rpx;
		background: #f3f6fb;
		border-radius: 36rpx;
		box-sizing: border-box;
	}

	.store-search-input {
		flex: 1;
		height: 72rpx;
		font-size: 28rpx;
		color: #111827;
	}

	.store-search-btn {
		padding-left: 20rpx;
		font-size: 28rpx;
		color: #2563eb;
	}

	.store-select-list {
		height: calc(72vh - 186rpx);
		max-height: calc(72vh - 186rpx);
		overflow-y: auto;
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
		-webkit-overflow-scrolling: touch;
	}

	.store-select-loading,
	.store-select-empty {
		padding: 80rpx 30rpx;
		text-align: center;
		font-size: 28rpx;
		color: #9ca3af;
	}

	.store-select-row {
		display: block;
		width: 100%;
		padding: 26rpx 30rpx;
		border-bottom: 1rpx solid #edf0f5;
		background: #fff;
		box-sizing: border-box;
		text-align: left;
		line-height: normal;
	}

	.store-select-row.active {
		background: #f0f6ff;
	}

	.store-select-row-hover {
		background: #f6f8fb;
	}

	.store-select-row-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10rpx;
	}

	.store-select-row-title {
		flex: 1;
		min-width: 0;
		padding-right: 20rpx;
	}

	.store-select-row-name {
		max-width: 500rpx;
		font-size: 30rpx;
		font-weight: 600;
		color: #111827;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.store-select-row-distance {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #2563eb;
	}

	.store-select-row-address {
		font-size: 24rpx;
		line-height: 34rpx;
		color: #6b7280;
	}

	.addAddress .default {
		padding: 0 30rpx;
		height: 90rpx;
		background-color: #fff;
		margin-top: 23rpx;
	}

	.addAddress .default checkbox {
		margin-right: 15rpx;
	}

	.addAddress .keepBnt {
		width: 690rpx;
		height: 86rpx;
		border-radius: 50rpx;
		text-align: center;
		line-height: 86rpx;
		margin: 80rpx auto 24rpx auto;
		font-size: 32rpx;
		color: #fff;
	}

	.addAddress .wechatAddress {
		width: 690rpx;
		height: 86rpx;
		border-radius: 50rpx;
		text-align: center;
		line-height: 86rpx;
		margin: 0 auto;
		font-size: 32rpx;
		color: #2563eb;
		border: 1rpx solid #2563eb;
	}

	.font_color {
		@include main_color(theme);
	}

	.relative {
		position: relative;
	}

	.icon-dizhi {
		font-size: 44rpx;
		z-index: 100;
	}

	.abs_right {
		position: absolute;
		right: 0;
	}

	/deep/ checkbox .uni-checkbox-input.uni-checkbox-input-checked {
		@include main_bg_color(theme);
		@include coupons_border_color(theme);
		color: #fff !important
	}

	/deep/ checkbox .wx-checkbox-input.wx-checkbox-input-checked {
		@include main_bg_color(theme);
		@include coupons_border_color(theme);
		color: #fff !important;
		margin-right: 0 !important;
	}
</style>
