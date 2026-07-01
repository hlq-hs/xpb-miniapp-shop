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
					<view class='item acea-row row-between-wrapper relative'>
						<view class='name'>所在地区</view>
						<view class="address">
							<picker mode="multiSelector" @change="bindRegionChange"
								@columnchange="bindMultiPickerColumnChange" :value="valueRegion" :range="multiArray">
								<view class='acea-row'>
									<view class="picker line1">{{region[0]}}，{{region[1]}}，{{region[2]}}</view>
									<view class='iconfont icon-xiangyou abs_right'></view>
								</view>
							</picker>
						</view>
					</view>
					<view class='item acea-row row-between-wrapper relative'>
						<view class='name'>详细地址</view>
						<input type='text' placeholder='请点击右侧地图选择地址' placeholder-style="color:#ccc;" name='detail'
							placeholder-class='placeholder' :value='userAddress.detail' disabled maxlength="100"></input>
						<view class='iconfont icon-dizhi font_color abs_right' @tap="chooseLocation"></view>
					</view>
				</view>
				<view class='default acea-row row-middle borRadius14'>
					<checkbox-group @change='ChangeIsDefault'>
						<checkbox :checked="userAddress.isDefault" />设置为默认地址
					</checkbox-group>
				</view>

				<button class='keepBnt bg_color' form-type="submit">立即保存</button>
				<!-- #ifdef MP -->
				<view class="wechatAddress" v-if="!id" @click="getWxAddress">导入微信地址</view>
				<!-- #endif -->
				<!-- #ifdef H5 -->
				<view class="wechatAddress" v-if="this.$wechat.isWeixin() && !id" @click="getAddress">导入微信地址</view>
				<!-- #endif -->
			</view>
		</form>
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
				selectType: ''
			};
		},
		computed: mapGetters(['isLogin']),
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
			} else {
				toLogin();
			}
		},
		methods: {
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
				this.$util.$L.getLocation().then(res=>{
					const locationOptions = {
						latitude: uni.getStorageSync('user_latitude'),
						longitude: uni.getStorageSync('user_longitude'),
						success: (res) => {
							this.applyLocationResult(res);
						}
					};
					// #ifdef MP-WEIXIN
					wx.chooseLocation(locationOptions);
					// #endif
					// #ifndef MP-WEIXIN
					uni.chooseLocation(locationOptions);
					// #endif
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
									id: 0
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
							postCode: userInfo.postalCode
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
				if (that.region.join('-') == '省-市-区') return that.$util.Tips({
					title: '请选择所在地区'
				});
				if (!value.detail) return that.$util.Tips({
					title: '请点击地图选择详细地址'
				});
				if (!that.userAddress.longitude || !that.userAddress.latitude) return that.$util.Tips({
					title: '请点击地图选择地址后再保存'
				});
				value.id = that.id;
				let regionArray = that.region;
				value.address = {
					province: regionArray[0],
					city: regionArray[1],
					district: regionArray[2],
					cityId: that.cityId,
				};
				value.isDefault = that.userAddress.isDefault;

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
							latitude: value.latitude
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

	.addAddress .list .item .name {
		// width: 195rpx;
		font-size: 30rpx;
		color: #333;
	}

	.addAddress .list .item .address {
		flex: 1;
		margin-left: 50rpx;
	}

	.addAddress .list .item input {
		width: 475rpx;
		font-size: 30rpx;
		font-weight: 400;
	}

	.addAddress .list .item .placeholder {
		color: #ccc;
	}

	.addAddress .list .item picker .picker {
		width: 410rpx;
		font-size: 30rpx;
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
