<template>
	<view v-show="visibleMenus.length" :style="[boxStyle]">
		<view v-if="isMany === 1">
			<view class="swiper">
				<swiper :interval="interval" :duration="duration" :style="'height:'+ navHigh +'px;'"
					@change='bannerfun'>
					<block>
						<swiper-item v-for="(item,indexw) in menuList" :key="indexw">
							<view class="menu acea-row" :id="'nav' + indexw" :style="[gridColumns]">
								<view :style="[titleColor]" class="item" :class="number===1?'four':number===2?'five':''"
									v-for="(itemn,indexn) in item.list" :key="indexn"
									@click="menusTap(itemn.info[1].value)">
									<view class="pictrue skeleton-radius">
										<view v-if="isCostInquiry(itemn)" class="cost-inquiry-menu-icon">询</view>
										<view v-else class="fixed-menu-icon" :class="getMenuIconConfig(itemn).bgClass">
											<text class="iconfont" :class="getMenuIconConfig(itemn).icon"></text>
										</view>
									</view>
									<view class="menu-txt">{{ itemn.info[0].value }}</view>
									<view class="menu-subtxt">{{ getMenuSubtitle(itemn) }}</view>
								</view>
							</view>
						</swiper-item>
					</block>
				</swiper>
			</view>
			<view class="dot acea-row row-center-wrapper" v-if="docConfig<2 && menuList.length>1">
				<view class="dot-item line_dot-item" :style="active==index?'background:'+ dotColor:''"
					v-for="(item,index) in menuList"></view>
			</view>
		</view>
		<view class="nav oneNav" v-else>
			<scroll-view scroll-x="true" style="white-space: nowrap; display: flex" show-scrollbar="false">
				<block v-for="(item, index) in visibleMenus" :key="index">
					<view class="item" v-show="item.status" :style="[titleColor, navItemStyle]" @click="menusTap(item.info[1].value)">
						<view class="pictrue skeleton-radius">
							<view v-if="isCostInquiry(item)" class="cost-inquiry-menu-icon">询</view>
							<view v-else class="fixed-menu-icon" :class="getMenuIconConfig(item).bgClass">
								<text class="iconfont" :class="getMenuIconConfig(item).icon"></text>
							</view>
						</view>
						<view class="menu-txt">{{ item.info[0].value }}</view>
						<view class="menu-subtxt">{{ getMenuSubtitle(item) }}</view>
					</view>
				</block>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import easyLoadimage from '@/components/base/easy-loadimage.vue';
	export default {
		name: 'menus',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			}
		},
		components: {
			easyLoadimage
		},
		data() {
			return {
				interval: 3000,
				duration: 500,
				menus: this.dataConfig.menuConfig.list || [],
				rowsNum: this.dataConfig.rowsNum.tabVal,
				number: this.dataConfig.number.tabVal,
				isMany: this.dataConfig.tabConfig.tabVal,
				docConfig: 0,
				dotColor: '#E93323',
				menuList: [],
				active: 0,
				navHigh: 0
			};
		},
		computed: {
			boxStyle() {
				return {
					borderRadius: this.dataConfig.bgStyle.val * 2 + 'rpx',
					background: `linear-gradient(${this.dataConfig.bgColor.color[0].item}, ${this.dataConfig.bgColor.color[1].item})`,
					margin: this.dataConfig.mbConfig.val * 2 + 'rpx' + ' ' + this.dataConfig.lrConfig.val * 2 + 'rpx' +' ' + 0,
					padding: this.dataConfig.upConfig.val * 2 + 'rpx' + ' ' + 0 + ' ' + this.dataConfig.downConfig.val *2 + 'rpx'
				}
			},
			gridColumns() {
				return {
					gridRowGap: this.dataConfig.contentConfig.val * 2 + 'rpx',
					gridTemplateColumns: `repeat(${this.menuColumnCount}, 1fr)`
				}
			},
			titleColor() {
				return {
					'color': this.dataConfig.titleColor.color[0].item,
				}
			},
			menuStyle() {
				return {
					'border-radius': this.dataConfig.contentStyle.val + 'px'
				}
			},
			navItemStyle() {
				return {
					width: (100 / this.menuColumnCount) + '%'
				};
			},
			menuColumnCount() {
				const configCount = this.dataConfig.number.tabVal == 0 ? 3 : (this.dataConfig.number.tabVal == 1 ? 4 : 5);
				const visibleCount = this.visibleMenus.length;
				return visibleCount > 0 && visibleCount < configCount ? visibleCount : configCount;
			},
			visibleMenus() {
				return this.menus.filter(item => item.status && !this.isCostInquiry(item));
			}
		},
		mounted() {
			if (this.rowsNum === 0) {
				if (this.number === 0) {
					this.pageNum(6)
				} else if (this.number === 1) {
					this.pageNum(8)
				} else {
					this.pageNum(10)
				}
			} else if (this.rowsNum === 1) {
				if (this.number === 0) {
					this.pageNum(9)
				} else if (this.number === 1) {
					this.pageNum(12)
				} else {
					this.pageNum(15)
				}
			} else {
				if (this.number === 0) {
					this.pageNum(12)
				} else if (this.number === 1) {
					this.pageNum(16)
				} else {
					this.pageNum(20)
				}
			}
			this.$nextTick(() => {
				if (this.menuList.length && this.isMany===1) {
					let that = this
					// #ifdef H5
					that.menuHeight()
					// #endif
					// #ifndef H5
					setTimeout(() => {
						that.menuHeight()
					}, 150)
					// #endif
				}
			})
		},
		methods: {
			isCostInquiry(item) {
				return !!(item && item.info && item.info[0] && item.info[0].value === '成本询价');
			},
			getMenuTitle(item) {
				return String(item && item.info && item.info[0] ? item.info[0].value : '').trim();
			},
			getMenuIconConfig(item) {
				const title = this.getMenuTitle(item);
				if (title.indexOf('充值') > -1) {
					return {
						icon: 'icon-menu-yuan',
						bgClass: 'menu-icon-recharge'
					};
				}
				if (title.indexOf('精品') > -1 || title.indexOf('推荐') > -1) {
					return {
						icon: 'icon-shoucang3',
						bgClass: 'menu-icon-recommend'
					};
				}
				if (title.indexOf('会员') > -1) {
					return {
						icon: 'icon-gerenzhongxin1',
						bgClass: 'menu-icon-member'
					};
				}
				if (title.indexOf('商城') > -1) {
					return {
						icon: 'icon-ic_box',
						bgClass: 'menu-icon-shop'
					};
				}
				return {
					icon: 'icon-gengduo2',
					bgClass: 'menu-icon-default'
				};
			},
			getMenuSubtitle(item) {
				const title = this.getMenuTitle(item);
				if (title.indexOf('充值') > -1) return '快速充值';
				if (title.indexOf('精品') > -1 || title.indexOf('推荐') > -1) return '优质好物';
				if (title.indexOf('会员') > -1) return '专属权益';
				if (title.indexOf('商城') > -1) return '正品保障';
				return '';
			},
			bannerfun(e) {
				this.active = e.detail.current;
			},
			menuHeight() {
				let that = this;
				const query = uni.createSelectorQuery().in(this);
				query.select('#nav0').boundingClientRect(data => {
					that.navHigh = data.height;
				}).exec();
			},
			pageNum(num) {
				let menus = this.visibleMenus;
				let count = Math.ceil(menus.length / num);
				let goodArray = new Array();
				for (let i = 0; i < count; i++) {
					let list = menus.slice(i * num, i * num + num);
					if (list.length)
						goodArray.push({
							list: list
						});
				}
				this.$set(this, 'menuList', goodArray);
			},
			menusTap(url) {
				if (!url || !String(url).trim()) {
					uni.showToast({ title: '未配置跳转路由', icon: 'none' });
					return;
				}
				let path = String(url).trim().replace(/\.vue(?=\?|$)/, '');
				if (!/^https?:\/\//i.test(path) && path.charAt(0) !== '/') {
					path = `/${path}`;
				}
				this.$util.navigateTo(path);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.dot {
		width: 100%;
		margin-top: 30rpx;

		.instruct {
			width: 50rpx;
			height: 36rpx;
			line-height: 36rpx;
			background-color: rgba(0, 0, 0, 0.8);
			color: #fff;
			border-radius: 16rpx;
			font-size: 24rpx;
			text-align: center;
		}

		.dot-item {
			width: 10rpx;
			height: 10rpx;
			background: rgba(0, 0, 0, .4);
			border-radius: 50%;
			margin: 0 4px;

			&.line_dot-item {
				width: 20rpx;
				height: 5rpx;
				border-radius: 3rpx;
			}
		}
	}

	.nav {
		.cost-inquiry-menu-icon {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background: linear-gradient(135deg, #ff8e9a, #f45b6d);
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 52rpx;
			font-weight: 600;
		}

		.fixed-menu-icon {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 12rpx 22rpx rgba(34, 107, 255, 0.22);

			.iconfont {
				color: #fff;
				font-size: 58rpx;
				font-weight: 700;
				line-height: 1;
			}

			.icon-menu-yuan {
				font-size: 64rpx;
			}
		}

		.menu-icon-recharge {
			background: linear-gradient(135deg, #1bc8f4 0%, #1c91ff 100%);
		}

		.menu-icon-recommend {
			background: linear-gradient(135deg, #ff8b8b 0%, #ff6464 100%);
		}

		.menu-icon-member {
			background: linear-gradient(135deg, #ffb12c 0%, #ff8a18 100%);
		}

		.menu-icon-shop {
			background: linear-gradient(135deg, #9b72ff 0%, #7657f4 100%);
		}

		.menu-icon-default {
			background: linear-gradient(135deg, #7fa7ff 0%, #2f73ff 100%);
		}

		.item {
			width: 20%;
			box-sizing: border-box;
			text-align: center;
			font-size: 24rpx;
			display: inline-block;

			.pictrue {
				width: 110rpx;
				height: 110rpx;
				margin: 0 auto;
				border-radius: 50%;
				overflow: hidden;

				image {
					width: 100%;
					height: 100%;
					border-radius: 50%;
				}

				&.on {
					image {
						border-radius: 0;
					}
				}
			}

			.menu-txt {
				margin-top: 15rpx;
			}

			.menu-subtxt {
				margin-top: 4rpx;
				color: #9aa3b1;
				font-size: 20rpx;
				line-height: 26rpx;
			}
		}
	}

	.swiper {
		.cost-inquiry-menu-icon {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background: linear-gradient(135deg, #ff8e9a, #f45b6d);
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 52rpx;
			font-weight: 600;
		}

		.fixed-menu-icon {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 12rpx 22rpx rgba(34, 107, 255, 0.22);

			.iconfont {
				color: #fff;
				font-size: 58rpx;
				font-weight: 700;
				line-height: 1;
			}

			.icon-menu-yuan {
				font-size: 64rpx;
			}
		}

		.menu-icon-recharge {
			background: linear-gradient(135deg, #1bc8f4 0%, #1c91ff 100%);
		}

		.menu-icon-recommend {
			background: linear-gradient(135deg, #ff8b8b 0%, #ff6464 100%);
		}

		.menu-icon-member {
			background: linear-gradient(135deg, #ffb12c 0%, #ff8a18 100%);
		}

		.menu-icon-shop {
			background: linear-gradient(135deg, #9b72ff 0%, #7657f4 100%);
		}

		.menu-icon-default {
			background: linear-gradient(135deg, #7fa7ff 0%, #2f73ff 100%);
		}

		z-index: 20;
		position: relative;
		overflow: hidden;

		.menu {
			display: grid;
			grid-template-rows: auto;
			width: 100%;
			padding: 0 20rpx;

			.item {
				.pictrue {
					width: 110rpx;
					height: 110rpx;
					margin: 0 auto;
					border-radius: 50%;
					overflow: hidden;

					image {
						width: 100%;
						height: 100%;
						border-radius: 50%;
					}

					&.on {
						image {
							border-radius: 0;
						}
					}
				}

				.menu-txt {
					text-align: center;
					font-size: 12px;
					margin-top: 14rpx;
				}

				.menu-subtxt {
					text-align: center;
					margin-top: 4rpx;
					color: #9aa3b1;
					font-size: 20rpx;
					line-height: 26rpx;
				}
			}
		}

		swiper,
		.swiper-item {
			width: 100%;
			display: block;
		}
	}
</style>
