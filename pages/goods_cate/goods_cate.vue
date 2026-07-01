<template>
		<view
			class="page"
			:data-theme="theme"
			:style="{height:winHeight + 'px'}"
		>
		<view class="cart-nav" :style="{ height: iStatusBarHeight + 'px'}"></view>
		<cate v-if="currentPage === 'one'" ref="catePage" :showSlide="showSlide"></cate>
		<contracted v-if="currentPage === 'two'" ref="catePage" :showSlide="showSlide"></contracted>
		<optimization v-if="currentPage === 'three'" ref="catePage" :showSlide="showSlide"></optimization>
		<fresh v-if="currentPage === 'four'" ref="catePage" :showSlide="showSlide"></fresh>
		<pageFooter v-if="footerShow"></pageFooter>
	</view>
</template>
<script>
	import pageFooter from '@/components/pageFooter/index.vue'
	import cate from './components/default_cate.vue';
	import optimization from './components/optimization.vue';
	import contracted from './components/contracted.vue';
	import fresh from './components/fresh.vue';
	// #ifdef H5
	import {getShare} from '@/api/public.js';
	// #endif
	import {mapGetters} from 'vuex';
	const app = getApp();
		export default {
			components: {
				cate,
				optimization,
				contracted,
				fresh,
				pageFooter
			},
			data() {
			return {
				footerShow:true,
				currentPage:'one',
				theme:app.globalData.theme,
				showSlide:true,
				winHeight:'',
				configApi: {}, //分享类容配置
				iStatusBarHeight: 0, // 状态栏高度
			}
		},
		computed: {
			...mapGetters(['isLogin', 'uid'])
		},
		onLoad(){
			let that = this;
			let config = that.$Cache.getItem('categoryConfig');
			// #ifdef APP-PLUS
			this.iStatusBarHeight = uni.getSystemInfoSync().statusBarHeight;
			// #endif
			that.showSlide = config.isShowCategory == 'true'? true : false;
			switch (config.categoryConfig) {
				case '1':
					that.$set(that,'currentPage','one');
					break;
				case '2':
					that.$set(that,'currentPage','two');
					break;
				case '3':
					that.$set(that,'currentPage','three');
					uni.hideTabBar()
					this.footerShow=false
					break;
				case '4':
					that.$set(that,'currentPage','four');
					uni.hideTabBar()
					this.footerShow=false
					break;
			}
			uni.getSystemInfo({
			    success: function (res) {
			        that.winHeight = res.windowHeight;
			    }
			});
			// #ifdef H5
			that.shareApi();
			// #endif
		},
		onShow(){
			switch (this.currentPage){
				case 'one':
					break;
				case 'two':
					break;
				case 'three':
					uni.hideTabBar()
					this.footerShow=false
					setTimeout(()=>{
							if(this.isLogin && this.$refs.catePage){
							//登录的情况下获取模板3,4的购物车商品数量和列表
								this.$refs.catePage.getCartNum();
								this.$refs.catePage.getCartLists(1);
						}
					},500)
					break;
				case 'four':
					uni.hideTabBar()
					this.footerShow=false
					setTimeout(()=>{
							if(this.isLogin && this.$refs.catePage){
								this.$refs.catePage.getCartNum();
								this.$refs.catePage.getCartLists(1);
						}
					},500)
					break;
			}
		},
		methods:{
			// #ifdef H5
			shareApi: function() {
				getShare().then(res => {
					this.$set(this, 'configApi', res.data);
					// #ifdef H5
					this.setOpenShare(res.data);
					// #endif
				})
			},
			// 微信分享；
			setOpenShare: function(data) {
				let that = this;
				if (that.$wechat.isWeixin()) {
					let configAppMessage = {
						desc: data.synopsis,
						title: data.title,
						link: location.href,
						imgUrl: data.img
					};
					that.$wechat.wechatEvevt(["updateAppMessageShareData", "updateTimelineShareData"],
						configAppMessage);
				}
			},
			// #endif
		},
		onReachBottom(){
			if(!this.$refs.catePage){
				return;
			}
			if(this.currentPage=='two'){
				this.$refs.catePage.getProductList();
			}
			if(this.currentPage=='three'){
				this.$refs.catePage.productslist();
			}
			if(this.currentPage=='four'){
				this.$refs.catePage.productslist();
			}
		}
	}
</script>
<style lang="scss">
	.page{
		background: #fff;
		height: 100% !important;
	}
	.cart-nav {
		position: fixed;
		z-index: 99;
		top: 0;
		width: 100%;
		background-color: #fff;
	}
</style>
