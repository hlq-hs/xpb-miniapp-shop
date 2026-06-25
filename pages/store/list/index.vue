<template>
	<view class="store-page">
		<view class="search-bar">
			<view class="search-input">
				<text class="iconfont icon-sousuo"></text>
				<input
					v-model="keywords"
					confirm-type="search"
					maxlength="30"
					placeholder="搜索门店名称/地址/电话/介绍"
					placeholder-class="placeholder"
					@confirm="handleSearch"
				/>
			</view>
			<view class="search-btn" @click="handleSearch">搜索</view>
		</view>

		<view class="store-list" v-if="list.length">
			<view class="store-card" v-for="item in list" :key="item.id" @click="goDetail(item)">
				<image class="store-image" :src="getStoreImage(item.picture)" mode="aspectFill" />
				<view class="store-main">
					<view class="store-top">
						<view class="title-wrap">
							<text class="store-name">{{ item.name || "未命名门店" }}</text>
						</view>
						<view class="store-distance">{{ formatDistance(item) }}</view>
					</view>
					<view class="store-address line2">{{ item.address || "-" }}</view>
					<view class="store-meta">
						<text class="score-star">★</text>
						<text class="score-text">{{ formatScore(item) }}</text>
						<text class="meta-split">|</text>
						<text class="meta-order">{{ formatOrderText(item) }}</text>
					</view>
					<view class="tag-list" v-if="parseStoreLabels(item).length">
						<text class="tag-item" v-for="(tag, index) in parseStoreLabels(item).slice(0, 5)" :key="index">{{ tag }}</text>
					</view>
				</view>
			</view>
			<Loading :loaded="loaded" :loading="loading"></Loading>
		</view>

		<emptyPage title="暂无门店数据" v-if="!list.length && loaded"></emptyPage>
	</view>
</template>

<script>
	import Loading from "@/pages/store/components/Loading";
	import emptyPage from "@/components/emptyPage.vue";
	import { adminStoreListApi } from "@/api/store.js";

	export default {
		components: {
			Loading,
			emptyPage
		},
		data() {
			return {
				keywords: "",
				page: 1,
				limit: 10,
				loading: false,
				loaded: false,
				list: [],
				defaultImage: "https://via.placeholder.com/160x160?text=Store",
				userLatitude: "",
				userLongitude: ""
			};
		},
		onLoad() {
			this.initLocation();
			this.getList(true);
		},
		onPullDownRefresh() {
			this.getList(true, true);
		},
		onReachBottom() {
			this.getList();
		},
		methods: {
			initLocation() {
				try {
					this.userLatitude = uni.getStorageSync("user_latitude") || "";
					this.userLongitude = uni.getStorageSync("user_longitude") || "";
				} catch (e) {}
				if (this.isValidCoordinate(this.userLatitude, this.userLongitude)) return;
				uni.getLocation({
					type: "wgs84",
					success: (res) => {
						this.userLatitude = res.latitude;
						this.userLongitude = res.longitude;
						try {
							uni.setStorageSync("user_latitude", res.latitude);
							uni.setStorageSync("user_longitude", res.longitude);
						} catch (e) {}
						this.list = this.list.slice();
					}
				});
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
			getStoreTags(item) {
				const intro = this.storeIntro(item);
				if (intro) {
					return intro.split(/[，,、\s]+/).filter(Boolean).slice(0, 5);
				}
				return ["服务热情", "环境整洁", "施工直播", "途虎直送"].slice(0, 4);
			},
			formatDistance(item) {
				const storeLatitude = Number(item.dimensionY);
				const storeLongitude = Number(item.longitudeX);
				const userLatitude = Number(this.userLatitude);
				const userLongitude = Number(this.userLongitude);
				if (
					this.isValidCoordinate(storeLatitude, storeLongitude) &&
					this.isValidCoordinate(userLatitude, userLongitude)
				) {
					const km = this.getDistanceKm(userLatitude, userLongitude, storeLatitude, storeLongitude);
					if (!Number.isNaN(km) && km >= 0) return `距您 ${km.toFixed(2)}km`;
				}
				if (item.distance) {
					const km = Number(item.distance) / 1000;
					if (!Number.isNaN(km) && km > 0) return `距您 ${km.toFixed(2)}km`;
				}
				return item.shopid ? `#${item.shopid}` : "";
			},
			formatScore(item) {
				return item.score || "4.98";
			},
			formatOrderText(item) {
				if (item.orderCount) return `${item.orderCount}单`;
				return "1.8万+单";
			},
			getStoreImages(picture) {
				if (!picture) return [];
				if (Array.isArray(picture)) return picture.filter(Boolean);
				if (typeof picture === "string") {
					const value = picture.trim();
					if (!value) return [];
					if (value[0] === "[" && value[value.length - 1] === "]") {
						try {
							const parsed = JSON.parse(value);
							return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
						} catch (e) {}
					}
					if (value.indexOf(",") > -1 && value.indexOf("http") > -1) {
						return value.split(",").map(item => item.replace(/[\[\]\"]/g, "").trim()).filter(Boolean);
					}
					return [value.replace(/[\[\]\"]/g, "").trim()].filter(Boolean);
				}
				return [];
			},
			getStoreImage(picture) {
				const images = this.getStoreImages(picture);
				return images[0] || this.defaultImage;
			},
			parseStoreLabels(item) {
				const source = item && (item.label || item.labels || item.tag || item.tags);
				if (!source) return [];
				if (Array.isArray(source)) {
					return source.map(tag => String(tag || "").trim()).filter(Boolean);
				}
				if (typeof source === "string") {
					const value = source.trim();
					if (!value) return [];
					if (value[0] === "[" && value[value.length - 1] === "]") {
						try {
							const parsed = JSON.parse(value);
							if (Array.isArray(parsed)) {
								return parsed.map(tag => String(tag || "").trim()).filter(Boolean);
							}
						} catch (e) {}
					}
					return value
						.split(/[,\uff0c|/;\u3001\s]+/)
						.map(tag => tag.trim())
						.filter(Boolean);
				}
				return [];
			},
			storeIntro(item) {
				const labels = this.parseStoreLabels(item);
				if (labels.length) return labels.join(" ");
				return "";
			},
			goDetail(item) {
				uni.setStorageSync("store_detail", item || {});
				uni.navigateTo({
					url: `/pages/store/detail/index?id=${item.id || ""}`
				});
			},
			handleSearch() {
				this.getList(true);
			},
			getList(reset = false, stopRefresh = false) {
				if (this.loading) return;
				if (!reset && this.loaded) return;
				if (reset) {
					this.page = 1;
					this.loaded = false;
					this.list = [];
				}
				this.loading = true;
				adminStoreListApi({
					isDelete: 0,
					keywords: this.keywords.trim(),
					limit: this.limit,
					page: this.page
				}).then((res) => {
					const pageData = res.data || {};
					const rows = pageData.list || [];
					this.list = reset ? rows : this.list.concat(rows);
					this.loaded = rows.length < this.limit || this.page >= (pageData.totalPage || 0);
					this.page += 1;
				}).catch((err) => {
					uni.showToast({
						title: err || "加载失败",
						icon: "none"
					});
					if (reset) this.loaded = true;
				}).finally(() => {
					this.loading = false;
					if (stopRefresh) uni.stopPullDownRefresh();
				});
			},
			makePhoneCall(phone) {
				if (!phone) {
					uni.showToast({
						title: "暂无联系电话",
						icon: "none"
					});
					return;
				}
				uni.makePhoneCall({
					phoneNumber: String(phone)
				});
			},
			openLocation(item) {
				const latitude = Number(item.dimensionY);
				const longitude = Number(item.longitudeX);
				if (!latitude || !longitude) {
					uni.showToast({
						title: "暂无定位信息",
						icon: "none"
					});
					return;
				}
				uni.openLocation({
					latitude,
					longitude,
					name: item.name || "门店位置",
					address: item.address || ""
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	page {
		background: #f5f5f5;
	}

	.store-page {
		min-height: 100vh;
		padding: 20rpx 20rpx 32rpx;
		box-sizing: border-box;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 20rpx;
	}

	.search-input {
		flex: 1;
		height: 76rpx;
		background: #fff;
		border-radius: 38rpx;
		display: flex;
		align-items: center;
		padding: 0 28rpx;
		box-sizing: border-box;
	}

	.search-input .iconfont {
		font-size: 30rpx;
		color: #999;
		margin-right: 16rpx;
	}

	.search-input input {
		flex: 1;
		height: 76rpx;
		font-size: 26rpx;
	}

	.placeholder {
		color: #b7bcc7;
	}

	.search-btn {
		width: 132rpx;
		height: 76rpx;
		border-radius: 38rpx;
		background: #ff4d3f;
		color: #fff;
		font-size: 28rpx;
		text-align: center;
		line-height: 76rpx;
	}

	.store-card {
		display: flex;
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 16rpx;
	}

	.store-image {
		width: 148rpx;
		height: 148rpx;
		border-radius: 12rpx;
		background: #eef1f7;
		flex-shrink: 0;
	}

	.store-main {
		flex: 1;
		margin-left: 18rpx;
		min-width: 0;
	}

	.store-top {
		display: flex;
		justify-content: space-between;
		gap: 12rpx;
		margin-bottom: 10rpx;
	}

	.title-wrap {
		flex: 1;
		min-width: 0;
	}

.store-name {
	font-size: 32rpx;
	font-weight: 600;
		color: #222;
		line-height: 1.4;
	}

	.store-distance {
		flex-shrink: 0;
		align-self: center;
		font-size: 26rpx;
		color: #555;
	}

	.store-address {
		font-size: 28rpx;
		color: #333;
		line-height: 1.5;
		margin-bottom: 12rpx;
	}

	.store-meta {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
		font-size: 24rpx;
		color: #999;
	}

	.score-star {
		color: #ff3b30;
		font-size: 24rpx;
		margin-right: 6rpx;
	}

	.score-text {
		color: #ff3b30;
		font-size: 30rpx;
		font-weight: 600;
	}

	.meta-split,
	.meta-order {
		margin-left: 8rpx;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
		margin-bottom: 18rpx;
	}

	.tag-item {
		padding: 4rpx 10rpx;
		border-radius: 6rpx;
		background: #f7f3eb;
		color: #8c6b2e;
		font-size: 22rpx;
		line-height: 30rpx;
	}

</style>
