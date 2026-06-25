<template>
	<view class="swiperBg" :style="[boxStyle]">
		<view class="swiper page_swiper" :class="docConfig" v-if="imgUrls.length">
			<swiper :autoplay="true" :circular="true" :interval="3000" :duration="500"
				:indicator-active-color="docColor" :current="swiperCur" :previous-margin="swiperType==0?'40rpx':''" :next-margin="swiperType==0?'40rpx':''"
				@change="swiperChange">
				<block v-for="(item,index) in imgUrls" :key="index">
					<swiper-item :class="{ active: index == swiperCur }">
						<view @click="goDetail(item)" class='slide-navigator acea-row row-between-wrapper tui-skeleton-rect'>
							<image :src="item.img" mode="aspectFill" :style="[imgStyle]" class="slide-image aa"></image>
						</view>
					</swiper-item>
				</block>
			</swiper>
			<view v-if="docType === 0" class="dots" :style="[dotStyle]">
				<block v-for="(item,index) in imgUrls" :key="index">
					<view class="dot-item"
						:style="{'background-color': swiperCur === index ? (dataConfig.themeStyleConfig.tabVal?dataConfig.docColor.color[0].item:themeColor)  : ''}">
					</view>
				</block>
			</view>
			<view v-if="docType === 1" class="dots" :style="[dotStyle]">
				<block v-for="(item,index) in imgUrls" :key="index">
					<view class="dot"
						:style="{'background-color': swiperCur === index ? (dataConfig.themeStyleConfig.tabVal?dataConfig.docColor.color[0].item:themeColor)  : ''}">
					</view>
				</block>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		navigatoPage
	} from "@/utils/index"
	let app = getApp();
	export default {
		name: 'swiperBg',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			},
			merId: {}
		},
		data() {
			return {
				indicatorDots: false,
				imgUrls: [], //鍥剧墖杞挱鏁版嵁
				txtStyle: this.dataConfig.txtStyle.type, //鎸囩ず鍣ㄤ綅缃?
				imageH: 310,
				swiperCur: 0,
				themeColor:this.$options.filters.filterTheme(app.globalData.theme)
			};
		},
		watch: {
			imageH(nVal, oVal) {
				let self = this
				this.imageH = nVal
			}
		},
		computed: {
			dotStyle() {
				return {
					padding: '0 50rpx',
					justifyContent: this.dataConfig.txtStyle.tabVal === 1 ? 'center' : this.dataConfig.txtStyle
						.tabVal === 2 ? 'flex-end' : 'flex-start'
				}
			},
			docType() {
				return this.dataConfig.docConfig.tabVal
			},
			swiperType(){
				return this.dataConfig.swiperStyleConfig.tabVal
			},
			boxStyle() {
				return {
					borderRadius: this.dataConfig.bgStyle.val * 2 + 'rpx',
					background: `linear-gradient(${this.dataConfig.bgColor.color[0].item}, ${this.dataConfig.bgColor.color[1].item})`,
					margin: this.dataConfig.mbConfig.val * 2 + 'rpx' + ' ' + this.dataConfig.lrConfig.val * 2 + 'rpx' +
						' ' + 0,
					padding: this.dataConfig.upConfig.val * 2 + 'rpx' + ' ' + '20rpx' + ' ' + this.dataConfig.downConfig.val *
						2 + 'rpx'
				}
			},
			docColor() {
				return this.dataConfig.docColor.color[0].item + '!important'
			},
			docConfig() {
				if (this.dataConfig.docConfig.tabVal == 1) {
					return 'square'
				} else if (this.dataConfig.docConfig.tabVal == 2) {
					return 'nodoc'
				} else {
					return 'circular'
				}
			},
			imgStyle() {
				return {
					"border-radius": this.dataConfig.contentStyle.val * 2 + 'rpx'
				}
			}
		},
		created() {
			this.imgUrls = this.dataConfig.swiperConfig.list
		},
		mounted() {
			let that = this;
			this.$nextTick(function() {
				uni.getImageInfo({
					src: that.setDomain(that.imgUrls[0].img),
					success: function(res) {
						that.$set(that, 'imageH', res.height);
					},
					fail: function(error) {
						that.$set(that, 'imageH', 310);
					}
				})
			})
		},
		methods: {
			setDomain: function(url) {
				url = url ? url.toString() : '';
				if (url.indexOf("https://") > -1) return url;
				else return url.replace('http://', 'https://');
			},
			swiperChange(e) {
				let {
					current,
					source
				} = e.detail;
				if (source === 'autoplay' || source === 'touch') {
					this.swiperCur = e.detail.current;
				}
			},
			goDetail(url) {
				let path = url.info[1].value
				this.$util.navigateTo(path);
			}
		}
	}
</script>

<style lang="scss" scoped>
	.dots {
		display: flex;
		flex-direction: row;
		position: absolute;
		bottom: 24rpx;
		align-items: center;
		width: 100%;
	}
	.dot-item {
		width: 10rpx;
		height: 10rpx;
		background-color: rgba(255, 255, 255, .4);
		border-radius: 50%;
		margin: 0 6rpx;
	}
	
	.dot {
		width: 16rpx;
		height: 6rpx;
		border-radius: 6rpx;
		margin-right: 6rpx;
		background-color: rgba(255, 255, 255, .4);
	}
	.swiperBg {
		position: relative;
		background: #fff;
		z-index: 1;

		.colorBg {
			position: absolute;
			left: 0;
			top: 0;
			height: 130rpx;
			width: 100%;
		}

		.page_swiper {
			position: relative;
			width: 100%;
			height: auto;
			margin: 0 auto;
			border-radius: 10rpx;
			overflow-x: hidden;
			/* #ifdef MP */
			z-index: 20;

			&.fillet {

				.swiper-item,
				image,
				.acea-row.row-between-wrapper {
					border-radius: 10rpx;
				}
			}

			.swiper-item,
			image,
			.acea-row.row-between-wrapper {
				width: 100%;
				height: 100%;
				margin: 0 auto;
			}

			swiper {
				width: 100%;
				display: block;
			}

			image {
				transform: scale(0.93);
				transition: all 0.6s ease;
			}

			swiper-item.active {
				image {
					transform: scale(1);
				}
			}

			&.circular {
				/deep/.uni-swiper-dot {
					width: 10rpx;
					height: 10rpx;
				}
			}

			&.square {
				/deep/.uni-swiper-dot {
					width: 20rpx;
					height: 5rpx;
					border-radius: 3rpx;
				}
			}

			&.nodoc {
				/deep/.uni-swiper-dot {
					display: none;
				}
			}
			/* #endif */
		}
	}

	/deep/.dot0 .uni-swiper-dots-horizontal {
		left: 10%;
	}

	/deep/.dot1 .uni-swiper-dots-horizontal {
		left: 50%;
	}

	/deep/.dot2 .uni-swiper-dots-horizontal {
		left: 90%;
	}

	.item-img image {
		display: block;
		width: 100%;
	}
</style>
