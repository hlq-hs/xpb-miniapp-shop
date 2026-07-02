<template>
	<!-- 搴曢儴瀵艰埅 -->
	<view :data-theme="theme">
		<view v-if="bottomNavigationList.length">
			<view class="page-footer" id="target" :style="[isSmallPage?boxStyle:'']">
				<view :style="[bgColor]" class="acea-row row-middle row-around bg-box">
					<view class="foot-item" v-for="(item,index) in bottomNavigationList" :key="index"
						@click="goRouter(item)">
						<block v-if="isActive(item)">
							<view v-if="index === 2" class="nav-cost-icon checked"><text>透明</text><text>修车</text></view>
							<view v-else-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon checked">
								<view></view><view></view><view></view><view></view>
							</view>
							<text v-else class="iconfont nav-icon checked" :class="fixedIcons[index] || fixedIcons[0]"></text>
							<view v-if="isSmallPage" class="txtchecked" :style="[checkColor]">{{item.name}}</view>
							<view v-else class="txt">{{item.name}}</view>
						</block>
						<block v-else>
							<view v-if="index === 2" class="nav-cost-icon"><text>透明</text><text>修车</text></view>
							<view v-else-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon">
								<view></view><view></view><view></view><view></view>
							</view>
							<text v-else class="iconfont nav-icon" :class="fixedIcons[index] || fixedIcons[0]"></text>
							<view class="unchecked" :style="[isSmallPage?fontColor:'']">{{item.name}}</view>
						</block>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState,
		mapGetters
	} from "vuex"
	import {
		getBottomNavigationApi
	} from '@/api/api.js';
	let app = getApp();
	export default {
		name: 'pageFooter',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			},
			isSmallPage: {
				type: Boolean,
				default: () => false
			}
		},
		computed: {
			//澶栭儴鐩掑瓙
			boxStyle() {
				if (this.dataConfig) {
					return {
						borderRadius: this.dataConfig.bgStyle.val ? this.dataConfig.bgStyle.val + 'px' : '0',
						padding: '0' + ' ' + this.dataConfig.lrConfig.val + 'px' + ' ' + 0
					}
				}
			},
			bgColor(){
				return {
					background: `linear-gradient(${this.dataConfig.bgColor.color[0].item}, ${this.dataConfig.bgColor.color[1].item})`,
				}
			},
			//鏍囩鏂囧瓧棰滆壊
			fontColor() {
				if (this.dataConfig) {
					return {
						color: this.dataConfig.fontColor.color[0].item
					};
				}

			},
			//閫変腑棰滆壊
			checkColor() {
				if (this.dataConfig) {
					return {
						color: this.dataConfig.themeStyleConfig.tabVal?this.dataConfig.checkColor.color[0].item:this.themeColor
					};
				}
			},
		},
		created() {
			let routes = getCurrentPages(); //鑾峰彇褰撳墠鎵撳紑杩囩殑椤甸潰璺敱鏁扮粍
			let curRoute = routes[routes.length - 1].route //鑾峰彇褰撳墠椤甸潰璺敱
			this.activeRouter = '/' + curRoute;
		},
		mounted() {
			if (this.activeRouter === '/pages/activity/small_page/index') {
				this.bottomNavigationList = this.dataConfig.menuList.list;
			} else {
				this.navigationInfo();
			}
		},
		data() {
			return {
				theme: app.globalData.theme,
				isCustom: '',
				bottomNavigationList: [],
				activeRouter: '',
				themeColor:this.$options.filters.filterTheme(app.globalData.theme),
				imgHost: this.$Cache.get('imgHost') || '',
				fixedIcons: [
					'icon-shouye8',
					{
						type: 'category'
					},
					'icon-quanbudingdan-xingerenzhongxin',
					'icon-fanhuishouye',
					'icon-gerenzhongxin1'
				]
			}
		},
		methods: {
			isActive(item) {
				return this.normalizeLink(item.link).split('?')[0] == this.activeRouter;
			},
			formatImage(url) {
				if (!url) return '';
				if (/^(data:|https?:\/\/|\/\/|\/static\/)/i.test(url)) return url;
				if (url.startsWith('static/')) return `/${url}`;
				const imgHost = this.imgHost || this.$Cache.get('imgHost') || '';
				return `${imgHost}${url.replace(/^\/+/, '')}`;
			},
			normalizeLink(link) {
				if (!link) return '';
				let url = String(link).trim().replace(/\.vue(\?.*)?$/, '$1');
				if (url && url.charAt(0) !== '/') url = `/${url}`;
				return url;
			},
			openLink(url, isTab = false) {
				const openUrl = this.normalizeLink(url);
				const openMethod = isTab ? 'switchTab' : 'navigateTo';
				uni[openMethod]({
					url: openUrl,
					fail: (err) => {
						const fallbackMethod = isTab ? 'reLaunch' : 'redirectTo';
						uni[fallbackMethod]({
							url: openUrl,
							fail: () => {
								uni.showToast({
									title: err.errMsg || '椤甸潰璺宠浆澶辫触',
									icon: 'none'
								});
							}
						});
					}
				});
			},
			navigationInfo() {
				getBottomNavigationApi().then(res => {
					let data = res.data;
					this.isCustom = data.isCustom; //鏄惁浣跨敤鑷畾涔夊鑸紝1浣跨敤锛?涓嶄娇鐢?					this.$store.commit('BottomNavigationIsCustom', this.isCustom == 1 ? true : false);
					if (data.isCustom == 1) {
						uni.hideTabBar()
						this.bottomNavigationList = data.bottomNavigationList;
					} else {
						uni.showTabBar();
					}
				})
			},
			goRouter(item) {
				var pages = getCurrentPages();
				var page = (pages[pages.length - 1]).$page.fullPath;
				const link = this.normalizeLink(item.link);
				if (link == page) return
				if (['/pages/index/index', '/pages/order_addcart/order_addcart',
						'/pages/user/index', '/pages/discover_index/index'
					].indexOf(link) > -1) {
					this.openLink(link, true);
				} else {
					this.openLink(link);
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: calc(98rpx+ constant(safe-area-inset-bottom)); ///鍏煎 IOS<11.2/
		height: calc(98rpx + env(safe-area-inset-bottom)); ///鍏煎 IOS>11.2/
	}

	.unchecked {
		color: #333;
		font-size: 24rpx;
	}

	.page-footer {
		position: fixed;
		bottom: 0;
		z-index: 999999;
		width: 100%;
		height: calc(98rpx+ constant(safe-area-inset-bottom)); ///鍏煎 IOS<11.2/
		height: calc(98rpx + env(safe-area-inset-bottom)); ///鍏煎 IOS>11.2/
		box-sizing: border-box;
		border-top: solid 1rpx #F3F3F3;
		background: radial-gradient(circle at 50% 13rpx,
			transparent 0,
			transparent 47rpx,
			#fff 48rpx,
			#fff 100%);
		box-shadow: 0px 0px 17rpx 1rpx rgba(206, 206, 206, 0.32);
		padding-bottom: constant(safe-area-inset-bottom); ///鍏煎 IOS<11.2/
		padding-bottom: env(safe-area-inset-bottom); ///鍏煎 IOS>11.2/

		&::before {
			content: '';
			position: absolute;
			left: 50%;
			top: -37rpx;
			width: 100rpx;
			height: 100rpx;
			transform: translateX(-50%);
			border: 3rpx solid #fff;
			border-radius: 50%;
			box-sizing: border-box;
			background: transparent;
			pointer-events: none;
		}

		.foot-item {
			display: flex;
			width: max-content;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			position: relative;

			.count-num {
				position: absolute;
				display: flex;
				justify-content: center;
				align-items: center;
				width: 40rpx;
				height: 40rpx;
				top: 0rpx;
				right: -15rpx;
				color: #fff;
				font-size: 20rpx;
				background-color: #FD502F;
				border-radius: 50%;
				padding: 4rpx;
			}
		}

		.bg-box{
			height: 100%;
			background: radial-gradient(circle at 50% 13rpx,
				transparent 0,
				transparent 47rpx,
				#fff 48rpx,
				#fff 100%) !important;
		}
		.foot-item image {
			height: 50rpx;
			width: 50rpx;
			text-align: center;
			margin: 0 auto;
		}

		.foot-item .nav-icon {
			width: 50rpx;
			height: 50rpx;
			line-height: 50rpx;
			text-align: center;
			margin: 0 auto;
			font-size: 44rpx;
			color: #666;
		}

		.foot-item .nav-icon.checked {
			@include main-color(theme);
		}

		.foot-item .nav-cost-icon {
			width: 102rpx;
			height: 102rpx;
			font-size: 25rpx;
			font-weight: 600;
			text-align: center;
			color: #29b6f6;
			background: transparent;
			border: 0;
			border-radius: 50%;
			box-sizing: border-box;
			margin-bottom: -52rpx;
			transform: translateY(-50rpx);
			box-shadow: none;
			position: relative;
			z-index: 2;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			line-height: 28rpx;
			letter-spacing: 4rpx;
		}

		.foot-item .nav-cost-icon.checked {
			color: #29b6f6;
		}

		.foot-item .nav-category-icon {
			width: 50rpx;
			height: 50rpx;
			margin: 0 auto;
			display: grid;
			grid-template-columns: repeat(2, 15rpx);
			grid-template-rows: repeat(2, 15rpx);
			gap: 7rpx;
			align-content: center;
			justify-content: center;
			color: #666;
		}

		.foot-item .nav-category-icon view {
			width: 15rpx;
			height: 15rpx;
			border: 4rpx solid currentColor;
			border-radius: 4rpx;
			box-sizing: border-box;
		}

		.foot-item .nav-category-icon.checked {
			color: #666;
		}

		.txtchecked {
			font-size: 24rpx;
		}

		.foot-item .txt {
			font-size: 24rpx;
			@include main-color(theme);
		}
	}
</style>
