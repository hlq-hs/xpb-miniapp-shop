<template>
	<view class="goodsList">
		<view class="item" v-for="(item,index) in tempArr" :key="index" @click="goDetail(item)">
			<view class="product-info">
				<view class="tag" v-if="getPrimaryTag(item)">{{ getPrimaryTag(item) }}</view>
				<view class="text line2">{{item.storeName}}</view>
				<view class="features" v-if="getProductTags(item).length">
					<view class="feature" v-for="tag in getProductTags(item)" :key="tag.id || tag.tagName">
						<view class="feature-icon">{{ getTagInitial(tag.tagName) }}</view>
						<text>{{ tag.tagName }}</text>
					</view>
				</view>
				<view class="bottom">
					<view class="sales">
						<view class="money" :class="String(item.price).length>8?'lengthStr':''">
							<text>￥</text>{{item.price}}
							<text class="item_sales">已售 {{item.sales || 0}}</text>
						</view>
					</view>
					<view class="product-action" v-if="item.stock>0">
						<view class="bnt" v-if="item.activity && (item.activity.type === '1' || item.activity.type === '2' || item.activity.type === '3')">立即购买</view>
						<view class="bnt" v-else @click.stop="goCartDuo(item)">
							加入购物车
							<view class="num" v-if="item.cartNum">{{item.cartNum}}</view>
						</view>
					</view>
					<view class="product-action" v-else>
						<view class="end">已售罄</view>
					</view>
				</view>
			</view>
			<image class="product-image" :src="getProductImage(item)" mode="aspectFill"></image>
		</view>
		<view class="empty-line" v-if="tempArr.length">我也是有底线的~</view>
	</view>
</template>

<script>
	export default {
		name: 'd_goodList',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			},
			tempArr: {
				type: Array,
				default: () => []
			},
			isLogin: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			getProductImage(item = {}) {
				return item.recommend_image || item.image || '';
			},
			getProductTags(item = {}) {
				const tags = item.productTags && Array.isArray(item.productTags.locationUnderTitle)
					? item.productTags.locationUnderTitle
					: [];
				return tags.filter(tag => tag && tag.tagName).slice(0, 3);
			},
			getPrimaryTag(item = {}) {
				const tags = this.getProductTags(item);
				return tags.length ? tags[0].tagName : '';
			},
			getTagInitial(name = '') {
				return String(name || '').trim().slice(0, 1);
			},
			goDetail(item) {
				this.$emit('detail', item);
			},
			goCartDuo(item) {
				this.$emit('gocartduo', item);
			}
		}
	};
</script>

<style scoped lang="scss">
	.goodsList {
		padding: 12rpx 22rpx 0;

		.item {
			position: relative;
			width: 100%;
			min-height: 318rpx;
			box-sizing: border-box;
			margin-bottom: 24rpx;
			padding: 26rpx 224rpx 26rpx 24rpx;
			border-radius: 22rpx;
			background: #fff;
			overflow: hidden;
			box-shadow: 0 18rpx 46rpx rgba(34, 89, 173, 0.12);

			.product-info {
				position: relative;
				z-index: 2;
			}

			.product-image {
				position: absolute;
				right: 0;
				top: 0;
				width: 242rpx;
				height: 100%;
				opacity: 0.92;
			}

			&::after {
				content: "";
				position: absolute;
				right: 140rpx;
				top: 0;
				width: 170rpx;
				height: 100%;
				z-index: 1;
				background: linear-gradient(90deg, #fff 5%, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0));
			}

			.tag {
				display: inline-flex;
				align-items: center;
				height: 42rpx;
				padding: 0 14rpx;
				border-radius: 8rpx;
				background: linear-gradient(90deg, #2f7cff 0%, #2563eb 100%);
				color: #fff;
				font-size: 22rpx;
				font-weight: 600;
			}

			.text {
				width: 270rpx;
				font-size: 29rpx;
				font-family: PingFang SC;
				font-weight: 800;
				color: #111827;
				line-height: 44rpx;
				margin: 20rpx 0 22rpx;
			}

			.features {
				display: flex;
				margin-bottom: 20rpx;
				min-height: 62rpx;
			}

			.feature {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-right: 12rpx;
				color: #2563eb;
				font-size: 18rpx;
				white-space: nowrap;
			}

			.feature-icon {
				width: 34rpx;
				height: 34rpx;
				margin-bottom: 8rpx;
				border-radius: 50%;
				line-height: 34rpx;
				text-align: center;
				color: #2563eb;
				font-size: 18rpx;
				font-weight: 700;
				background: #eef4ff;
			}

			.bottom {
				width: 100%;
				min-height: 70rpx;

				.sales {
					font-size: 22rpx;
					color: #8E8E8E;

					.money {
						font-size: 39rpx;
						font-weight: bold;
						margin-right: 18rpx;
						@include price_color(theme);

						.item_sales {
							font-size: 24rpx;
							font-family: PingFang SC;
							font-weight: 400;
							padding-left: 17rpx;
							color: #8e8e8e;
						}

						text {
							font-size: 28rpx;
						}
					}
				}
			}

			.product-action {
				position: relative;
				z-index: 4;
				width: 150rpx;
				margin: 20rpx 0 0;
			}

			.bnt {
				width: 150rpx;
				padding: 0 18rpx;
				height: 46rpx;
				line-height: 46rpx;
				box-sizing: border-box;
				background: linear-gradient(90deg, #3d82ff 0%, #2563eb 100%);
				border-radius: 8rpx;
				font-size: 22rpx;
				font-weight: 700;
				color: #fff;
				text-align: center;
				position: relative;

				.num {
					@include main_color(theme);
					@include coupons_border_color(theme);
					background: #fff;
					min-width: 12rpx;
					border-radius: 15px;
					position: absolute;
					right: -14rpx;
					top: -15rpx;
					font-size: 22rpx;
					padding: 0 10rpx;
					height: 34rpx;
					line-height: 34rpx;
				}
			}

			.end {
				width: 150rpx;
				padding: 0 18rpx;
				height: 46rpx;
				line-height: 46rpx;
				box-sizing: border-box;
				border-radius: 8rpx;
				font-size: 22rpx;
				color: #fff;
				text-align: center;
				background: rgba(203, 203, 203, 1);
			}
		}

		.empty-line {
			height: 240rpx;
			padding-top: 100rpx;
			text-align: center;
			color: #6b7280;
			font-size: 28rpx;
			background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(245, 248, 255, 0.9));
		}
	}

	.lengthStr {
		font-size: 36rpx !important;
	}
</style>
