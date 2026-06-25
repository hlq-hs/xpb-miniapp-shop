<template>
	<view class="store-detail-page">
		<view class="gallery-card">
			<swiper
				class="gallery-swiper"
				indicator-dots
				autoplay
				circular
				interval="3000"
				duration="500"
				indicator-color="rgba(255,255,255,0.45)"
				indicator-active-color="#ffffff"
				@change="onSwiperChange"
			>
				<swiper-item v-for="(item, index) in images" :key="index">
					<image class="gallery-image" :src="item" mode="aspectFill" @click="previewImages(index)"></image>
				</swiper-item>
			</swiper>
			<view class="gallery-count">{{ currentIndex + 1 }}/{{ images.length }}</view>
		</view>

		<view v-if="false" class="score-card">
			<view class="score-box">
				<view class="score-value">{{ score }}</view>
				<view class="score-stars">★★★★★</view>
			</view>
			<view class="score-tip">近期有 2787 个购买者给了好评</view>
		</view>

		<view class="info-card">
			<view class="title-line">
				<text class="store-name">{{ detail.name || "门店详情" }}</text>
			</view>

			<view class="info-row">
				<text class="label">服务范围</text>
				<text class="value">{{ storeIntro(detail) || "-" }}</text>
			</view>
			<view class="info-row">
				<text class="label">营业时间</text>
				<text class="value">{{ businessTime }}</text>
			</view>

			<view class="info-row address-row">
				<view class="address-text">
					<view class="address-main">{{ detail.address || "-" }}</view>
					<view class="distance-text">{{ distanceText }}</view>
				</view>
				<view class="action-icons">
					<view class="icon-item" @click="openLocation(detail)">
						<text class="iconfont icon-dizhi"></text>
						<text class="action-text">导航</text>
					</view>
					<view class="icon-item" @click="makePhoneCall(detail.phone)">
						<text class="iconfont icon-dadianhua01"></text>
						<text class="action-text">电话</text>
					</view>
				</view>
			</view>
		</view>

		<view class="intro-card" v-if="storeDescription(detail)">
			<view class="section-title">门店介绍</view>
			<rich-text class="intro-content" :nodes="storeDescription(detail)"></rich-text>
		</view>
	</view>
</template>

<script>
const EMOJI_ALIAS_MAP = {
	innocent: "😇",
	embarrassed: "😳",
	embarassed: "😳",
	blush: "😊",
	smile: "😄",
	grin: "😁",
	laughing: "😆",
	joy: "😂",
	wink: "😉",
	heart_eyes: "😍",
	kissing_heart: "😘",
	sob: "😭",
	cry: "😢",
	sweat_smile: "😅",
	slight_smile: "🙂",
	angry: "😠",
	rage: "😡",
	thumbsup: "👍",
	thumbs_up: "👍",
	heart: "❤️"
};

export default {
	data() {
		return {
			detail: {},
			userLatitude: "",
			userLongitude: "",
			currentIndex: 0,
			defaultImage: "https://via.placeholder.com/320x240?text=Store"
		};
	},
	computed: {
		images() {
			const list = this.getStoreImages(this.detail.picture);
			if (list.length === 1) return [list[0], list[0]];
			if (list.length >= 2) return [list[0], list[1]];
			return [this.defaultImage, this.defaultImage];
		},
		score() {
			return this.detail.score || "4.98";
		},
		businessTime() {
			return this.detail.businessTime || "08:00-21:00（洗车08:00-20:00）";
		},
		distanceText() {
			return this.formatDistance(this.detail) || "距离您未知";
		}
	},
	onLoad() {
		try {
			this.userLatitude = uni.getStorageSync("user_latitude") || "";
			this.userLongitude = uni.getStorageSync("user_longitude") || "";
			this.detail = uni.getStorageSync("store_detail") || {};
		} catch (e) {
			this.detail = {};
		}
	},
	methods: {
		parseStoreLabels(item) {
			const source = item && (item.label || item.labels || item.tag || item.tags);
			if (!source) return [];
			if (Array.isArray(source)) {
				return source.map((tag) => String(tag || "").trim()).filter(Boolean);
			}
			if (typeof source === "string") {
				const value = source.trim();
				if (!value) return [];
				if (value[0] === "[" && value[value.length - 1] === "]") {
					try {
						const parsed = JSON.parse(value);
						if (Array.isArray(parsed)) {
							return parsed.map((tag) => String(tag || "").trim()).filter(Boolean);
						}
					} catch (e) {}
				}
				return value
					.split(/[,\uff0c|/;\u3001\s]+/)
					.map((tag) => tag.trim())
					.filter(Boolean);
			}
			return [];
		},
		storeIntro(item) {
			const labels = this.parseStoreLabels(item);
			if (labels.length) return labels.join(" ");
			return "";
		},
		storeDescription(item) {
			if (!item) return "";
			const candidates = [
				item.introduction,
				item.introduce,
				item.description,
				item.content,
				item.detail,
				item.desc
			];
			for (let i = 0; i < candidates.length; i += 1) {
				const value = this.normalizeStoreRichText(candidates[i]);
				if (value) return value;
			}
			const specficsValue = this.normalizeStoreRichText(item.specfics || item.specifies || item.specifications || item.specifics);
			if (specficsValue) return specficsValue;
			return "";
		},
		resolveEmojiAlias(alias) {
			const key = String(alias || "").trim().toLowerCase().replace(/^:+|:+$/g, "");
			return EMOJI_ALIAS_MAP[key] || "";
		},
		escapeHtml(text) {
			return String(text || "")
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;");
		},
		replaceMarkdownImages(text) {
			return String(text || "").replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
				const emojiText = this.resolveEmojiAlias(alt);
				if (emojiText) return emojiText;
				const safeAlt = String(alt || "").replace(/"/g, "&quot;");
				const safeSrc = String(src || "").trim();
				if (!safeSrc) return "";
				return `<img src="${safeSrc}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;" />`;
			});
		},
		replaceEmojiImageTags(text) {
			return String(text || "").replace(/<img\b[^>]*alt=['"]?([^'"\s>]+)[^>]*>/gi, (match, alt) => {
				const emojiText = this.resolveEmojiAlias(alt);
				return emojiText || match;
			});
		},
		normalizeStoreRichText(value) {
			if (!value) return "";
			if (Array.isArray(value)) {
				return this.normalizeStoreRichText(
					value.map((item) => String(item || "").trim()).filter(Boolean).join("<br/>")
				);
			}
			let text = String(value).trim();
			text = this.replaceMarkdownImages(text);
			text = this.replaceEmojiImageTags(text);
			if (!/<[^>]+>/.test(text)) {
				return `<div>${this.escapeHtml(text).replace(/\r?\n/g, "<br/>")}</div>`;
			}
			return text.replace(/\r?\n/g, "<br/>");
		},
		normalizeRichText(value) {
			if (!value) return "";
			if (Array.isArray(value)) {
				return this.normalizeRichText(
					value.map((item) => String(item || "").trim()).filter(Boolean).join("<br/>")
				);
			}
			let text = String(value).trim();
			// 把 Markdown 图片语法转成 rich-text 可识别的 img 标签
			text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
				const safeAlt = String(alt || "").replace(/"/g, "&quot;");
				const safeSrc = String(src || "").trim();
				if (!safeSrc) return "";
				return `<img src="${safeSrc}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;" />`;
			});
			return text;
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
					return value
						.split(",")
						.map((item) => item.replace(/[\[\]\"]/g, "").trim())
						.filter(Boolean);
				}
				return [value.replace(/[\[\]\"]/g, "").trim()].filter(Boolean);
			}
			return [];
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
				if (!Number.isNaN(km) && km >= 0) return `距离您 ${km.toFixed(2)}km`;
			}
			if (item.distance) {
				const km = Number(item.distance) / 1000;
				if (!Number.isNaN(km) && km > 0) return `距离您 ${km.toFixed(2)}km`;
			}
			return "";
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
		onSwiperChange(event) {
			this.currentIndex = event.detail.current || 0;
		},
		previewImages(index) {
			uni.previewImage({
				current: this.images[index],
				urls: this.images
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
	background: #f6f6f6;
}

.store-detail-page {
	padding: 22rpx;
}

.gallery-card,
.score-card,
.info-card {
	background: #fff;
	border-radius: 24rpx;
}

.gallery-card {
	overflow: hidden;
	margin-bottom: 14rpx;
	position: relative;
}

.gallery-swiper {
	height: 320rpx;
	border-radius: 24rpx;
	overflow: hidden;
}

.gallery-image {
	width: 100%;
	height: 100%;
	background: #edf1f7;
}

.gallery-count {
	position: absolute;
	right: 20rpx;
	bottom: 20rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(0, 0, 0, 0.45);
	color: #fff;
	font-size: 22rpx;
	line-height: 1;
	z-index: 2;
}

.score-card {
	display: flex;
	align-items: center;
	overflow: hidden;
	margin-bottom: 16rpx;
}

.score-box {
	width: 180rpx;
	padding: 20rpx 0;
	background: linear-gradient(180deg, #ffb166, #ff8d3c);
	color: #fff;
	text-align: center;
}

.score-value {
	font-size: 64rpx;
	font-weight: 700;
	line-height: 1;
}

.score-stars {
	margin-top: 10rpx;
	font-size: 22rpx;
	letter-spacing: 2rpx;
}

.score-tip {
	flex: 1;
	padding: 0 24rpx;
	font-size: 30rpx;
	color: #222;
}

.info-card {
	padding: 28rpx;
}

.intro-card {
	margin-top: 16rpx;
	padding: 28rpx;
	background: #fff;
	border-radius: 24rpx;
}

.title-line {
	margin-bottom: 18rpx;
}

.section-title {
	margin-bottom: 18rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	line-height: 1.4;
}

.store-name {
	display: block;
	font-size: 42rpx;
	font-weight: 700;
	color: #111;
	line-height: 1.35;
}

.info-row {
	display: flex;
	align-items: flex-start;
	font-size: 29rpx;
	line-height: 1.75;
	color: #222;
}

.info-row + .info-row {
	margin-top: 6rpx;
}

.label {
	width: 138rpx;
	flex-shrink: 0;
	color: #666;
}

.value {
	flex: 1;
	color: #222;
}

.address-row {
	align-items: flex-start;
	justify-content: space-between;
	margin-top: 14rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f1f1f1;
}

.address-text {
	flex: 1;
	min-width: 0;
}

.address-main {
	font-size: 30rpx;
	line-height: 1.7;
	color: #222;
}

.distance-text {
	display: block;
	margin-top: 10rpx;
	font-size: 26rpx;
	color: #999;
}

.action-icons {
	display: flex;
	align-items: flex-start;
	gap: 28rpx;
	margin-left: 18rpx;
	padding-top: 4rpx;
}

.icon-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #333;
}

.icon-item .iconfont {
	font-size: 40rpx;
	margin-bottom: 6rpx;
}

.action-text {
	font-size: 24rpx;
	line-height: 1;
	color: #666;
}

.intro-content {
	font-size: 28rpx;
	line-height: 1.8;
	color: #333;
	word-break: break-all;
}
</style>
</style>
