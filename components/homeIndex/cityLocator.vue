<template>
	<view class="city-locator">
		<view class="city-main" @click.stop="requestLocationAuthorization">
			<text class="iconfont icon-dizhi location-icon"></text>
			<text class="city-name">{{ displayCity }}</text>
		</view>
	</view>
</template>

<script>
	import { getAddressDefault } from "@/api/user.js";
	import { getCityList } from "@/utils/index.js";

	const CITY_CACHE_KEY = "home_selected_city";
	const PROVINCE_CACHE_KEY = "home_selected_province";

	export default {
		name: "cityLocator",
		data() {
			return {
				cityName: "",
				provinceName: "",
				cityList: []
			};
		},
		computed: {
			displayCity() {
				const name = String(this.cityName || "").trim();
				if (!name) return "定位";
				return name.replace(/市$/, "").slice(0, 4);
			}
		},
		created() {
			this.cityName = uni.getStorageSync(CITY_CACHE_KEY) || "";
			this.provinceName = uni.getStorageSync(PROVINCE_CACHE_KEY) || "";
			this.loadCityList();
			if (!this.cityName) this.loadDefaultAddressCity();
		},
		methods: {
			requestLocationAuthorization() {
				// #ifdef MP-WEIXIN
				uni.getSetting({
					success: (setting) => {
						const locationSetting = setting && setting.authSetting
							? setting.authSetting["scope.userLocation"]
							: undefined;
						if (locationSetting === true) {
							this.locateCity();
							return;
						}
						if (locationSetting === false) {
							this.showLocationSettingGuide();
							return;
						}
						uni.authorize({
							scope: "scope.userLocation",
							success: () => this.locateCity(),
							fail: () => this.showLocationSettingGuide()
						});
					},
					fail: () => this.locateCity()
				});
				// #endif

				// #ifndef MP-WEIXIN
				this.locateCity();
				// #endif
			},
			showLocationSettingGuide() {
				uni.showModal({
					title: "需要定位权限",
					content: "请允许获取位置信息，用于显示当前城市",
					confirmText: "去设置",
					confirmColor: "#f44336",
					success: (modalResult) => {
						if (!modalResult.confirm) return;
						uni.openSetting({
							success: (settingResult) => {
								if (settingResult.authSetting && settingResult.authSetting["scope.userLocation"]) {
									this.locateCity();
								}
							}
						});
					}
				});
			},
			loadCityList() {
				const cached = this.$Cache && this.$Cache.getItem ? this.$Cache.getItem("cityList") : null;
				if (Array.isArray(cached) && cached.length) {
					this.cityList = cached;
					return Promise.resolve(cached);
				}
				return getCityList().then((list) => {
					this.cityList = Array.isArray(list) ? list : [];
					return this.cityList;
				}).catch(() => []);
			},
			loadDefaultAddressCity() {
				const token = this.$store && this.$store.state && this.$store.state.app
					? this.$store.state.app.token
					: "";
				if (!token) return;
				getAddressDefault().then((res) => {
					const address = (res && res.data) || {};
					if (address.city) this.saveCity(address.province || "", address.city);
				}).catch(() => {});
			},
			saveCity(province, city) {
				this.provinceName = String(province || "").trim();
				this.cityName = String(city || "").trim();
				uni.setStorageSync(PROVINCE_CACHE_KEY, this.provinceName);
				uni.setStorageSync(CITY_CACHE_KEY, this.cityName);
			},
			async matchCityByText(text) {
				const source = String(text || "").replace(/\s+/g, "");
				if (!source) return null;
				const provinces = this.cityList.length ? this.cityList : await this.loadCityList();
				for (let i = 0; i < provinces.length; i += 1) {
					const province = provinces[i] || {};
					const cities = Array.isArray(province.child) ? province.child : [];
					for (let j = 0; j < cities.length; j += 1) {
						const city = cities[j] || {};
						const cityName = String(city.name || "").trim();
						const shortName = cityName.replace(/市$|自治州$|地区$|盟$/, "");
						if (cityName && (source.indexOf(cityName) !== -1 || (shortName && source.indexOf(shortName) !== -1))) {
							return { province: province.name || "", city: cityName };
						}
					}
				}
				return null;
			},
			locateCity() {
				uni.getLocation({
					type: "wgs84",
					success: (result) => {
						uni.setStorageSync("user_latitude", result.latitude);
						uni.setStorageSync("user_longitude", result.longitude);
						this.openLocationPicker(result.latitude, result.longitude);
					},
					fail: (error) => {
						const message = String((error && error.errMsg) || "");
						if (/deny|denied|auth/i.test(message)) {
							this.showLocationSettingGuide();
							return;
						}
						uni.showToast({ title: "定位失败，可点击箭头选择城市", icon: "none" });
					}
				});
			},
			openLocationPicker(latitude, longitude) {
				const options = {
					latitude,
					longitude,
					success: async (result) => {
						uni.setStorageSync("user_latitude", result.latitude || latitude);
						uni.setStorageSync("user_longitude", result.longitude || longitude);
						const matched = await this.matchCityByText(`${result.address || ""}${result.name || ""}`);
						if (matched) {
							this.saveCity(matched.province, matched.city);
							uni.showToast({ title: `已选择${this.displayCity}`, icon: "none" });
							return;
						}
						uni.showToast({ title: "无法识别城市，请手动选择", icon: "none" });
					}
				};
				// #ifdef MP-WEIXIN
				wx.chooseLocation(options);
				// #endif
				// #ifndef MP-WEIXIN
				uni.chooseLocation(options);
				// #endif
			}
		}
	};
</script>

<style lang="scss" scoped>
	.city-locator {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #fff;
	}

	.location-icon {
		margin-right: 4rpx;
		font-size: 28rpx;
	}

	.city-main {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.city-name {
		max-width: 82rpx;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 25rpx;
	}

</style>
