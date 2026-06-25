<template>
	<view>
		<view class="navTabBox" :class="{isFixed:isFixed}" :style="[boxStyle]">
			<view class="longTab">
				<scroll-view scroll-x="true" style="white-space: nowrap; display: flex;" scroll-with-animation
					:scroll-left="tabLeft" show-scrollbar="true">
					<view class="longItem"
						:style="'color:' + (index == tabClick ? checkColor : fontColor)+';--color:'+checkColor"
						:data-index="index" :class="index===tabClick?'click':''" v-for="(item,index) in tabList"
						:key="index" :id="'id'+index" @click="longClick(index,item)">{{ item.title }}
					</view>
				</scroll-view>
			</view>
		</view>
		<view style="height: 70rpx"></view>
	</view>
</template>

<script>

	let app = getApp();
	export default {
		name: 'tabNav',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			},
			isFixed: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				tabClick: 0, //鐎佃壈鍩呴弽蹇氼潶閻愮懓鍤?				isLeft: 0, //鐎佃壈鍩呴弽蹇庣瑓閸掓帞鍤庢担宥囩枂
				isWidth: 0, //濮ｅ繋閲滅€佃壈鍩呴弽蹇撳窗娴?
				mainWidth: 0,
				tabLeft: 0,
				isTop: 0,
				navHeight: 35,
				tabItem: null ,//tab闁鑵戦惃鍕嚠鐠?
				themeColor:this.$options.filters.filterTheme(app.globalData.theme)
			};
		},
		computed: {
			boxStyle() {
				return {
					borderRadius: this.dataConfig.bgStyle.val * 2 + 'rpx',
					background: `linear-gradient(${this.dataConfig.bgColor.color[0].item}, ${this.dataConfig.bgColor.color[1].item})`,
					margin: 0 + ' ' + 2 * this.dataConfig.lrConfig.val + 'rpx' + ' ' + 0 ,
				}
			},
			fontColor() {
				return this.dataConfig.fontColor.color[0].item
			},
			checkColor() {
				return this.dataConfig.themeStyleConfig.tabVal?this.dataConfig.checkColor.color[0].item:this.themeColor
			},
			tabList() {
				return (this.dataConfig.listConfig.list || []).filter(item => !this.isMojibakeTitle(item.title))
			},
		},
		created() {
			let that = this
			uni.getSystemInfo({
				success(e) {
					that.isWidth = (e.windowWidth) / 5
				}
			})
			setTimeout((e) => {
				let statusHeight = uni.getSystemInfoSync().statusBarHeight;
				const query = uni.createSelectorQuery().in(this);
				query.select('.navTabBox').boundingClientRect(data => {
					that.navHeight = (data.height + statusHeight) * 2;
				}).exec();
			}, 300)
			that.$nextTick(function() {
				uni.getSystemInfo({
					success: function(res) {
						that.windowHeight = res.windowHeight;
					}
				});
			})
			// #ifdef MP || APP-PLUS
			this.isTop = (uni.getSystemInfoSync().statusBarHeight + 43) + 'px'
			// #endif
			// #ifdef H5
			this.isTop = 0
			// #endif
		},
		watch: {
			tabClick: {
				handler(newValue, oldValue) {
					if (this.tabItem) this.$emit('changeTab', newValue, this.tabItem);
				},
				immediate: true
			}
		},
		methods: {
			isMojibakeTitle(title) {
				return /[�锟鐧鐨鐢鐩閰閫闃闈鍟鍏鍙鍔瀹佸剆婊姝傛淇绋潖銆锛妫棣栭]/.test(title || '')
			},
			longClick(index, item) {
				this.tabItem = item;
				this.tabClick = index; //鐠佸墽鐤嗙€佃壈鍩呴悙鐟板毊娴滃棗鎽㈡稉鈧稉?
				this.$nextTick(() => {
					let id = 'id' + index;
					this.tabLeft = (index - 2) * this.isWidth //鐠佸墽鐤嗘稉瀣灊缁惧じ缍呯純?
				})
			},
		}
	}
</script>

<style lang="scss" scoped>
	.navTabBox {
		width: 100%;
		height: 70rpx;
		color: rgba(255, 255, 255, 1);
		position: fixed;
		z-index: 99;
		padding: 0 20rpx;
		&.isFixed {
			z-index: 10;
			position: fixed;
			left: 0;
			width: 100%;
			/* #ifdef H5 */
			top: 0;
			/* #endif */
		}

		.click {
			color: white;
		}

		.longTab {
			.longItem {
				height: 70rpx;
				display: inline-block;
				line-height: 70rpx;
				text-align: center;
				font-size: 28rpx;
				color: #333333;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				margin-right: 30rpx;
				&.click {
					font-weight: bold;
					font-size: 30rpx;
					position: relative;

					&::after {
						content: '';
						width: 40rpx;
						height: 4rpx;
						background: var(--color);
						position: absolute;
						bottom: 0;
						left: 50%;
						transform: translateX(-50%);
					}
				}
			}
		}
	}
</style>
