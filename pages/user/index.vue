<template>
	<view :data-theme="theme">
		<view class="new-users copy-data">
			<view class="mid" style="flex:1;overflow: hidden;">
				<scroll-view scroll-y="true">
					<view class="bg"></view>
					<view class="head pad30">
						<view class="user-card">
							<view class="user-info" @click="goEdit()">
								<image class="avatar" :src='userInfo.avatar' v-if="userInfo.avatar && uid"></image>
								<view v-else class="avatar"></view>
								<view class="info">
										<view class="name" v-if="!isLogin" @tap="openAuto">
											{{ loginText }}
										</view>
									<view class="name" v-if="userInfo && uid">
										{{userInfo && userInfo.nickname && uid ? userInfo.nickname : ''}}
										<view class="vip" v-if="userInfo.vip">
											<image :src="userInfo.vipIcon" alt="">
												<view style="margin-left: 10rpx;" class="vip-txt">{{userInfo.vipName|| ''}}
												</view>
										</view>
									</view>
									<view class="num" v-if="userInfo && userInfo.phone && uid">
										<view class="num-txt">{{userInfo.phone}}</view>
										<view class="icon">
										</view>
									</view>
										<view class="phone" v-if="!userInfo.phone && isLogin" @tap.stop="bindPhone">{{ bindPhoneText }}</view>
									<!-- #ifdef APP-PLUS -->
									<text class="iconfont icon-shezhi app_set" @click.stop="appUpdate()"></text>
									<!-- #endif -->
								</view>
							</view>
							<view class="num-wrapper">
								<view class="num-item" @click="goMenuPage('/pages/users/user_money/index')">
									<text class="num">{{ totalAssets }}</text>
										<view class="txt">{{ balanceText }}</view>
								</view>
								<view class="num-item" @click="goMenuPage('/pages/users/user_integral/index')">
									<text class="num">{{userInfo.integral && uid ? userInfo.integral: 0}}</text>
										<view class="txt">{{ integralText }}</view>
								</view>
								<view class="num-item" @click="goMenuPage('/pages/users/user_coupon/index')">
									<text class="num">{{userInfo.couponCount && uid ? userInfo.couponCount : 0}}</text>
										<view class="txt">{{ couponText }}</view>
								</view>
								<view class="num-item" @click="goMenuPage('/pages/users/user_goods_collection/index')">
									<text class="num">{{userInfo.collectCount && uid ? userInfo.collectCount : 0}}</text>
										<view class="txt">{{ collectText }}</view>
								</view>
							</view>
						</view>
						<view class="order-wrapper section-card">
							<view class="order-hd section-head flex">
									<view class="left section-title">{{ orderCenterText }}</view>
									<view class="right section-more flex" @click="menusTap('/pages/users/order_list/index')">{{ viewAllText }}
									<text class="iconfont icon-xiangyou"></text> 
								</view>
							</view>
							<view class="order-bd section-body">
								<block v-for="(item,index) in orderMenu" :key="index">
									<view class="order-item" @click="menusTap(item.url)"> 
										<view class="pic">
											<text class="iconfont pic_status" :class="item.img"></text>
											<text class="order-status-num" v-if="item.num > 0">{{ item.num }}</text>
										</view>
										<view class="txt">{{item.title}}</view>
									</view>
								</block>
							</view>
						</view>
					</view>
					<view class="contenBox" id="pageIndex">
						<view class="inquiry-wrapper section-card">
							<view class="inquiry-hd section-head flex">
								<view class="left section-title">{{ inquiryOrderText }}</view>
								<view class="right section-more flex" @click="menusTap('/pages/users/inquiry_order_list/index')">
									<text>{{ viewAllText }}</text>
									<text class="iconfont icon-xiangyou"></text>
								</view>
							</view>
							<view class="inquiry-bd section-body">
								<block v-for="(item,index) in inquiryOrderMenu" :key="index">
									<view class="inquiry-item" @click="menusTap(item.url)">
										<view class="pic">
											<text class="iconfont pic_status" :class="[item.img, item.iconClass]"></text>
											<text class="order-status-num" v-if="item.num > 0">{{ item.num }}</text>
										</view>
										<view class="txt">{{item.title}}</view>
									</view>
								</block>
							</view>
						</view>
						<!-- 杞挱 -->
						<view class="slider-wrapper" @click.native="bindEdit('userBanner')" v-if="imgUrls != null && imgUrls.length > 0">
							<swiper v-if="imgUrls.length>0" indicator-dots="true" :autoplay="autoplay" :circular="circular" :interval="interval"
								:duration="duration" indicator-color="rgba(255,255,255,0.6)" indicator-active-color="#fff">
								<block v-for="(item,index) in imgUrls" :key="index">
									<swiper-item class="borRadius14">
										<image :src="item.pic" class="slide-image" @click="navito(item.url)"></image>
									</swiper-item>
								</block>
							</swiper>
						</view>
						<!-- 浼氬憳鑿滃崟 -->
						<view class="user-menus section-card" style="margin-top: 20rpx;" @click.native="bindEdit('userMenus')">
								<view class="menu-title section-title">{{ myServiceText }}</view>
							<view class="list-box section-body">
								<block v-for="(item,index) in MyMenus" :key="index">
									<view class="item" @click="handleUserMenuTap(item)"
										v-if="!isHiddenUserMenu(item)">
										<image :src="item.pic"></image>
										<text>{{item.name}}</text>
									</view>
								</block>
							</view>
						</view>
						<!-- 暂时注释底部版权支持图，避免额外远程图片加载 -->
						<!-- <image :src="copyImage" alt="" class='support'> -->
					</view>
				</scroll-view>
			</view>
		</view>
		<pageFooter></pageFooter>
	</view>
</template>
<script>
	let sysHeight = uni.getSystemInfoSync().statusBarHeight + 'px';
	import pageFooter from '@/components/pageFooter/index.vue'
	import Cache from '@/utils/cache';
	import {goPage} from '@/libs/iframe.js'
	import {BACK_URL} from '@/config/cache';
	import {getMenuList, getVipCashAmount} from '@/api/user.js';
	import {orderData} from '@/api/order.js';
	import {getCity, tokenIsExistApi} from '@/api/api.js';
	import {toLogin} from '@/libs/login.js';
	import {mapGetters} from "vuex";
	import {
		getCityList
	} from "@/utils";
	// #ifdef H5
	import Auth from '@/libs/wechat';
	// #endif
	// #ifdef H5
	import {getShare} from '@/api/public.js';
	// #endif
	import {setThemeColor} from '@/utils/setTheme.js'
	import animationType from '@/utils/animationType.js'
	const app = getApp();
	const settlementRepairInfoUrl = '/pages/store/settlement_repair_info/index';
	const disabledUserMenuUrls = [
		'/pages/promoter/user_spread_user/index'
	];
	const disabledUserMenuUrlParts = ['user_' + 'cash'];
	export default {
		components:{
			pageFooter
		},
		computed: {
			...mapGetters(['isLogin', 'chatUrl', 'uid','bottomNavigationIsCustom']),
			totalAssets() {
				return this.formatMoney(this.toMoneyNumber(this.platformBalance) + this.toMoneyNumber(this.storeBalance));
			},
			platformBalance() {
				return this.formatMoney((this.userInfo && this.userInfo.nowMoney) || 0);
			},
			storeBalance() {
				return this.formatMoney(this.vipCashAmount);
			}
		},
		data() {
			return {
				urlDomain: this.$Cache.get("imgHost"),
					orderMenu: [
						{img: 'icon-daifukuan', title: '\u5f85\u4ed8\u6b3e', url: '/pages/users/order_list/index?status=0', num: 0},
						{img: 'icon-daifahuo', title: '\u5f85\u53d1\u8d27', url: '/pages/users/order_list/index?status=1', num: 0},
						{img: 'icon-daishouhuo', title: '\u5f85\u6536\u8d27', url: '/pages/users/order_list/index?status=2', num: 0},
						{img: 'icon-daipingjia', title: '\u5f85\u8bc4\u4ef7', url: '/pages/users/order_list/index?status=3', num: 0},
						{img: 'icon-a-shouhoutuikuan', title: '\u552e\u540e/\u9000\u6b3e', url: '/pages/users/user_return_list/index', num: 0},
					],
				inquiryOrderMenu: [
					{img: 'icon-quanbudingdan-xingerenzhongxin', title: '\u5168\u90e8', url: '/pages/users/inquiry_order_list/index', num: 0},
					{img: 'icon-daifukuan-xingerenzhongxin', title: '\u5f85\u652f\u4ed8', url: '/pages/users/inquiry_order_list/index?status=0', num: 0},
					{img: 'icon-daifahuo-xingerenzhongxin', title: '\u5f85\u53d1\u8d27', url: '/pages/users/inquiry_order_list/index?status=1', num: 0},
					{img: 'icon-baoguo_shouhuo_o', iconClass: 'inquiry-receive-icon', title: '\u5f85\u6536\u8d27', url: '/pages/users/inquiry_order_list/index?status=2', num: 0},
					{img: 'icon-duihao', iconClass: 'inquiry-complete-icon', title: '\u5df2\u5b8c\u6210', url: '/pages/users/inquiry_order_list/index?status=4', num: 0},
				],
				imgUrls: [],
				userMenu: [],
				autoplay: true,
				circular: true,
				interval: 3000,
				duration: 500,
				isAuto: false, //娌℃湁鎺堟潈鐨勪笉浼氳嚜鍔ㄦ巿鏉?
				isShowAuth: false, //鏄惁闅愯棌鎺堟潈
				orderStatusNum: {},
				MyMenus: [],
				wechatUrl: [],
				servicePic: `${this.$Cache.get("imgHost")}crmebimage/perset/staticImg/customer.png`,
				sysHeight: sysHeight,
				// #ifdef MP
				pageHeight: '100%',
				// #endif
				// #ifdef H5 || APP-PLUS
				pageHeight: app.globalData.windowHeight,
				// #endif
				// #ifdef H5
				isWeixin: Auth.isWeixin(),
				//#endif
				configApi: {}, //鍒嗕韩绫诲閰嶇疆
				theme: '',
				bgColor:'#e93323',
				chatConfig:{
					consumer_hotline:'',
					telephone_service_switch:'close',
					wx_chant_independent:'open'
				} ,//瀹㈡湇閰嶇疆
				loginText: '\u8bf7\u70b9\u51fb\u767b\u5f55',
				bindPhoneText: '\u7ed1\u5b9a\u624b\u673a\u53f7',
				balanceText: '\u4f59\u989d',
				integralText: '\u79ef\u5206',
				couponText: '\u4f18\u60e0\u5238',
				collectText: '\u6536\u85cf',
				orderCenterText: '\u8ba2\u5355\u4e2d\u5fc3',
				inquiryOrderText: '\u8be2\u4ef7\u8ba2\u5355',
				myServiceText: '\u6211\u7684\u670d\u52a1',
				contactServiceText: '\u8054\u7cfb\u5ba2\u670d',
				userInfo: {},
				vipCashAmount: 0,
				userCenterLoading: false,
				copyImage: '',//鐗堟潈鍥剧墖
				viewAllText: '\u67e5\u770b\u5168\u90e8',
			}
		},
		onLoad() {
			app.globalData.theme = this.$Cache.get('theme')
			if(app.globalData.isIframe){
				setTimeout(()=>{
					let active;
					document.getElementById('pageIndex').children.forEach(dom=>{
						dom.addEventListener('click', (e)=>{
							e.stopPropagation();
							e.preventDefault();
							if(dom === active) return;
							dom.classList.add('borderShow');
							active && active.classList.remove('borderShow');
							active = dom;
						})
					})
				});
			}
			let that = this;
			// #ifdef H5 || APP-PLUS
			that.$set(that, 'pageHeight', app.globalData.windowHeight);
			// #endif
			that.$set(that, 'MyMenus', that.normalizeMyMenus(app.globalData.MyMenus));
			that.$set(that,'chatConfig',Cache.getItem('chatConfig'));
			// #ifdef H5
			that.shareApi();
			// #endif
			that.bgColor = '#f8fafc';
			 // #ifdef APP-PLUS
			setTimeout(()=>{
			 	uni.setNavigationBarColor({
			 		frontColor: '#000000',
			 		backgroundColor:that.bgColor,   
			 	});
			 },500)
			 // #endif
			 // #ifdef MP
			 uni.setNavigationBarColor({
			 	frontColor: '#000000',
			 	backgroundColor:that.bgColor,   
			 });
			 // #endif
		},
		onShow: function() {
			this.loadUserCenterData();
			// 暂时注释版权图接口加载，避免拉取额外装饰图片
			// this.copyrightImage();
			this.theme = this.$Cache.get('theme')
			app.globalData.theme = this.$Cache.get('theme')
			if (!this.$Cache.getItem('cityList')) getCityList();
			!this.$store.state.app.bottomNavigationIsCustom&&uni.showTabBar();
			// #ifdef H5
			let that = this;
			uni.getSystemInfo({
				success: function(res) {
					that.pageHeight = res.windowHeight + 'px'
				}
			});
			// #endif
			// #ifdef MP
			let  query  = uni.createSelectorQuery(); 
			let dom = query.select('.new-users');
			// #endif
		},
		methods: {
			waitAll(tasks) {
				return Promise.all(tasks.map(task => Promise.resolve(task).catch(error => error)));
			},
			loadUserCenterData() {
				if (this.userCenterLoading) {
					return;
				}
				this.userCenterLoading = true;
				uni.showLoading({
					title: '加载中...',
					mask: true
				});
				this.waitAll([
					this.getMyMenus(),
					this.getTokenIsExist()
				]).finally(() => {
					this.userCenterLoading = false;
					uni.hideLoading();
				});
			},
			//鏍￠獙token鏄惁鏈夋晥,true涓烘湁鏁堬紝false涓烘棤鏁?
			getTokenIsExist() {
				return tokenIsExistApi().then(res => {
					let tokenIsExist = res.data;
					if (this.isLogin && tokenIsExist) {
						return this.$store.dispatch('USERINFO').then(res => {
							this.userInfo = res;
							return this.waitAll([
								this.getOrderData(),
								this.fetchVipCashAmount(),
								this.refreshInquiryOrderMenu()
							]);
						});
					}else{
						this.$store.commit("LOGOUT");
						this.$store.commit('UPDATE_LOGIN', '');
						this.$store.commit('UPDATE_USERINFO', {});
						this.userInfo = {}
						this.vipCashAmount = 0;
					}
				}).catch(error => error);
			},
			fetchVipCashAmount() {
				const phone = String((this.userInfo && (this.userInfo.phone || this.userInfo.mobile)) || '').trim();
				if (!phone) {
					this.vipCashAmount = 0;
					return Promise.resolve();
				}
				return getVipCashAmount(phone).then(res => {
					this.vipCashAmount = this.formatVipCashAmount(res.data);
				}).catch(() => {
					this.vipCashAmount = 0;
				});
			},
			formatVipCashAmount(data) {
				if (data === null || data === undefined) return 0;
				if (typeof data === 'number' || typeof data === 'string') return data || 0;
				return data.amount || data.cashAmount || data.vipCashAmount || data.balance || data.storeBalance || 0;
			},
			toMoneyNumber(value) {
				const num = Number(value);
				return Number.isNaN(num) ? 0 : num;
			},
			formatMoney(value) {
				return this.toMoneyNumber(value).toFixed(2);
			},
			// 暂时注释版权图接口加载，避免拉取额外装饰图片
			// copyrightImage() {
			// 	copyrightApi().then(res => {
			// 		if (res.data) {
			// 			this.copyImage = res.data.companyImage;
			// 		} else {
			// 			this.copyImage = `${this.urlDomain}crmebimage/perset/staticImg/support.png`;
			// 		}
			// 	}).catch(err => {
			// 		return this.$util.Tips({
			// 			title: err
			// 		})
			// 	});
			// },
			bindEdit(name) {
				if (app.globalData.isIframe) {
					window.parent.postMessage(
						{
							name: name
						},
						'*'
					);
					return;
				}
			},
			menusTap(url) {
				if (!this.isLogin && url != '/pages/users/user_sgin/index') {
					this.openAuto(); 
				}else{
					goPage().then(res => {
						if(['/pages/order_addcart/order_addcart','/pages/user/index','/pages/index/index'].indexOf(url) !== -1){
							uni.switchTab({
								url: url
							})
						}else{
							uni.navigateTo({
								animationType: animationType.type,
								animationDuration: animationType.duration,
								url: url
							})
						}
					})
				}
			},
			handleUserMenuTap(item) {
				if (this.isDisabledUserMenu(item)) return;
				const targetUrl = this.resolveUserMenuUrl(item);
				this.menusTap(targetUrl);
			},
			isHiddenUserMenu(item) {
				if (!item || typeof item !== 'object') return true;
				if (item.url === '/pages/service/index') return true;
				return this.isDisabledUserMenu(item);
			},
			isDisabledUserMenu(item) {
				if (!item || !item.url) return false;
				return disabledUserMenuUrls.indexOf(item.url) !== -1 ||
					disabledUserMenuUrlParts.some(part => item.url.indexOf(part) !== -1);
			},
			resolveUserMenuUrl(item) {
				if (!item || typeof item !== 'object') {
					return '';
				}
				if (String(item.name || '').trim() === '\u624b\u638c\u8ba2\u5355') {
					return '/pages/users/palm_order_list/index';
				}
				if (String(item.name || '').trim() === '\u6d88\u8d39\u5386\u53f2') {
					return settlementRepairInfoUrl;
				}
				return item.url || '';
			},
			navito(url) {
				if(url.indexOf("http") !== -1){
					// #ifdef H5
					location.href = url
					// #endif
					// #ifdef APP-PLUS || MP
					uni.navigateTo({
						url: '/pages/users/web_page/index?webUel=' + url
					})
					// #endif
				}else{
					if(['/pages/order_addcart/order_addcart','/pages/user/index'].indexOf(url) == -1){
						uni.navigateTo({
							url:url
						})
					}else{
						uni.switchTab({
							url:url
						})
					}
				}
			},
            onClickService() {
				if(this.chatConfig.telephone_service_switch === 'open'){
					uni.makePhoneCall({
					    phoneNumber: this.chatConfig.consumer_hotline //浠呬负绀轰緥
					});
				}else{
					// #ifdef APP-PLUS
					uni.navigateTo({
						animationType: animationType.type,
						animationDuration: animationType.duration,
						url: '/pages/users/web_page/index?webUel=' + this.chatUrl + '&title=瀹㈡湇'
					})
					// #endif
					// #ifndef APP-PLUS
					if (!app.globalData.isIframe) {
						location.href = this.chatUrl;
					}else{
						return false
					}
					// #endif
				}
			},
			getOrderData() {
				let that = this;
				return orderData().then(res => {
					that.orderMenu.forEach((item, index) => {
						switch (item.title) {
								case '\u5f85\u4ed8\u6b3e':
									item.num = res.data.unPaidCount
									break
								case '\u5f85\u53d1\u8d27':
									item.num = res.data.unShippedCount
									break
								case '\u5f85\u6536\u8d27':
									item.num = res.data.receivedCount
									break
								case '\u5f85\u8bc4\u4ef7':
									item.num = res.data.evaluatedCount
									break
								case '\u552e\u540e/\u9000\u6b3e':
									item.num = res.data.refundCount
									break
						}
					})
					that.$set(that, 'orderMenu', that.orderMenu);
				}).catch(error => error);
			},
			requestInquiryOrderList(payload) {
				return new Promise((resolve, reject) => {
					uni.request({
						url: 'https://xpbn.kbiso.com/api/MiniKaisi/Order/GetList',
						method: 'POST',
						data: payload,
						success: resolve,
						fail: reject
					});
				});
			},
			extractInquiryOrderList(data) {
				if (Array.isArray(data)) return data;
				if (Array.isArray(data && data.data)) return data.data;
				if (Array.isArray(data && data.list)) return data.list;
				if (Array.isArray(data && data.rows)) return data.rows;
				if (Array.isArray(data && data.items)) return data.items;
				if (Array.isArray(data && data.result)) return data.result;
				if (Array.isArray(data && data.records)) return data.records;
				return [];
			},
			async refreshInquiryOrderMenu() {
				const userId = Number(this.uid || 0) || 0;
				const mobile = String((this.userInfo && this.userInfo.phone) || '').trim();
				if (!userId || !mobile) {
					this.inquiryOrderMenu = this.inquiryOrderMenu.map(item => ({
						...item,
						num: 0
					}));
					return;
				}
				try {
					const response = await this.requestInquiryOrderList({
						pagesize: 200,
						pageno: 1,
						userId,
						mobile
					});
					const body = response.data || {};
					if (Number(body.msgid) !== 200) {
						return;
					}
					const list = this.extractInquiryOrderList(body.data);
					const counts = list.reduce((result, item) => {
						const status = Number(item.orderStatus || 0);
						result.all += 1;
						if (status === 1) result.pending += 1;
						if (status === 2) result.delivering += 1;
						if (status === 3) result.shipping += 1;
						if (status === 4) result.completed += 1;
						return result;
					}, {
						all: 0,
						pending: 0,
						delivering: 0,
						shipping: 0,
						completed: 0
					});
					this.inquiryOrderMenu = this.inquiryOrderMenu.map(item => {
						if (item.title === '全部') {
							return { ...item, num: counts.all };
						}
						if (item.title === '待支付') {
							return { ...item, num: counts.pending };
						}
						if (item.title === '待发货') {
							return { ...item, num: counts.delivering };
						}
						if (item.title === '待收货') {
							return { ...item, num: counts.shipping };
						}
						if (item.title === '已完成') {
							return { ...item, num: counts.completed };
						}
						return item;
					});
				} catch (error) {
				}
			},
			// 鎵撳紑鎺堟潈
			openAuto() {
				Cache.set(BACK_URL, '')
				toLogin();
			},
			// 缁戝畾鎵嬫満
			bindPhone() {
				uni.navigateTo({
					animationType: animationType.type,
					animationDuration: animationType.duration,
					url: '/pages/users/app_login/index'
				})
			},
			/**
			 * 
			 * 鑾峰彇涓汉涓績鍥炬爣
			 */
			getMyMenus: function() {
				let that = this;
				// if (this.MyMenus.length) return;
				return getMenuList().then(res => {
					const normalizedMenus = that.normalizeMyMenus(res.data.routine_my_menus);
					app.globalData.MyMenus = normalizedMenus;
					that.$set(that, 'MyMenus', normalizedMenus);
					that.wechatUrl = normalizedMenus.filter((item) => {
						return item.url.indexOf('service') !== -1
					})
					normalizedMenus.map((item) => {
						if (item.url.indexOf('service') !== -1) that.servicePic = item.pic
					})
					// that.imgUrls = res.data.routine_my_banner
					if(res.data.routine_my_banner){
						that.imgUrls = res.data.routine_my_banner
					}
				}).catch(err=>{
					console.log(err);
					return err;
				});
			},
			normalizeMyMenus(menus = []) {
				return menus.filter((item) => {
					return !this.isDisabledUserMenu(item);
				}).map((item) => {
					if (!item || typeof item !== 'object') {
						return item;
					}
					if (String(item.name || '').trim() === '\u6d88\u8d39\u5386\u53f2') {
						return {
							...item,
							url: settlementRepairInfoUrl
						};
					}
					return item;
				});
			},
			// 缂栬緫椤甸潰
			goEdit() {
				if (this.isLogin == false) {
					this.openAuto();
				} else {
					uni.navigateTo({
						animationType: animationType.type,
						animationDuration: animationType.duration,
						url: '/pages/infos/user_info/index'
					})
				}
			},
			goMenuPage(url) {
				if (this.isLogin) {
					uni.navigateTo({
						animationType: animationType.type,
						animationDuration: animationType.duration,
						url
					})
				} else {
					this.openAuto()
				}
			},
			appUpdate(){
				uni.navigateTo({
					url:'/pages/users/app_update/app_update',
					animationType: animationType.type,
					animationDuration: animationType.duration,
				})
			},
			// #ifdef H5
			shareApi: function() {
				const j462f7 = ''
				getShare().then(res => {
					this.$set(this, 'configApi', res.data);
					// #ifdef H5
					this.setOpenShare(res.data);
					// #endif
				})
			},
			// 寰俊鍒嗕韩锛?
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
			}
			// #endif
		}
	}
</script>

<style lang="scss" scoped>
	page,
	body {
		height: 100%;
	}
	.mp-header{
		background: #f8fafc;
	}
	.bg {
		position: absolute;
		left: 0;
		top: 0;
		width:100%;
		height: 420rpx;
		background: linear-gradient(180deg, #f8fafc 0%, #eef5ff 100%);
	}
	.contenBox {
		padding: 0 24rpx 100rpx;
	}

	.support {
		width: 219rpx;
		height: 74rpx;
		margin: 54rpx auto;
		display: block;
	}

	.new-users {
		display: flex;
		flex-direction: column;
		height: 100%;

		.sys-head {
			position: relative;
			width: 100%;
			background: linear-gradient(90deg, $bg-star1 0%, $bg-end1 100%);

			.sys-title {
				z-index: 10;
				position: relative;
				height: 43px;
				text-align: center;
				line-height: 43px;
				font-size: 36rpx;
				color: #FFFFFF;
			}
		}

		.head {
			background: linear-gradient(180deg, #f8fafc 0%, #eef5ff 100%);
			.user-card {
				position: relative;
				width: 100%;
				margin: 0 auto;
				padding: 35rpx 0 30rpx 0;
				.user-info {
					z-index: 20;
					position: relative;
					display: flex;

					.avatar {
						width: 120rpx;
						height: 120rpx;
						border-radius: 50%;
					}

					.info {
						flex: 1;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						margin-left: 20rpx;
						padding: 15rpx 0;
						position: relative;

						.name {
							display: flex;
							align-items: center;
							color: #0f172a;
							font-size: 31rpx;

							.vip {
								display: flex;
								align-items: center;
								padding: 6rpx 20rpx;
								background: rgba(0, 0, 0, 0.2);
								border-radius: 18px;
								font-size: 20rpx;
								margin-left: 12rpx;

								image {
									width: 27rpx;
									height: 27rpx;
								}
							}
						}
						.app_set{
							position: absolute;
							font-size: 36rpx;
							color: #334155;
							top: 40rpx;
							right: 20rpx;
						}

						.num {
							display: flex;
							align-items: center;
							font-size: 26rpx;
							color: #64748b;

							image {
								width: 22rpx;
								height: 23rpx;
								margin-left: 20rpx;
							}
						}
					}
				}

				.num-wrapper {
					z-index: 30;
					position: relative;
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-top: 30rpx;
					color: #0f172a;

					.num-item {
						width: 33.33%;
						text-align: center;

						.num {
							font-size: 42rpx;
							font-weight: bold;
						}

						.txt {
							margin-top: 10rpx;
							font-size: 26rpx;
							color: #64748b;
						}
					}
				}

				.sign {
					z-index: 200;
					position: absolute;
					right: -12rpx;
					top: 80rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					width: 120rpx;
					height: 60rpx;
					background: linear-gradient(90deg, rgba(255, 225, 87, 1) 0%, rgba(238, 193, 15, 1) 100%);
					border-radius: 29rpx 4rpx 4rpx 29rpx;
					color: #282828;
					font-size: 28rpx;
					font-weight: bold;
				}
			}

			.order-wrapper {
				position: relative;
				z-index: 11;
				margin-bottom: 20rpx;
                
				.order-hd {
					padding-bottom: 22rpx;
				}

				.order-bd {
					display: flex;
					justify-content: space-between;
					flex-wrap: wrap;
					row-gap: 12rpx;

					.order-item {
						display: flex;
						flex: 1;
						min-width: 16.66%;
						flex-direction: column;
						justify-content: center;
						align-items: center;

						.pic {
							position: relative;
							text-align: center;

							image {
								width: 48rpx;
								height: 48rpx;
							}
						}

						.txt {
							margin-top: 12rpx;
							font-size: 26rpx;
							color: #454545;
						}
					}
				}
			}
		}

		.slider-wrapper {
			margin: 20rpx 0;
			height: 138rpx;

			swiper,
			swiper-item {
				height: 100%;
			}

			image {
				width: 100%;
				height: 100%;
			}
		}

		.section-card {
			background-color: #fff;
			border-radius: 14rpx;
			width: 100%;
			box-sizing: border-box;
		}

		.section-head {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx 30rpx 24rpx;
		}

		.section-title {
			color: #282828;
			font-size: 30rpx;
			font-weight: 600;
		}

		.section-more {
			align-items: center;
			color: #666666;
			font-size: 26rpx;

			.icon-xiangyou {
				margin-left: 5rpx;
				font-size: 24rpx;
			}
		}

		.section-body {
			padding: 0 20rpx 24rpx;
		}

		.inquiry-wrapper {
			margin-bottom: 20rpx;

			.inquiry-hd {
				padding-bottom: 18rpx;
			}

			.inquiry-bd {
				display: flex;
				justify-content: space-between;
				flex-wrap: wrap;
				row-gap: 12rpx;
				padding-top: 0;
			}

			.inquiry-item {
				display: flex;
				flex: 1;
				min-width: 20%;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				padding: 12rpx 0 0;
			}

			.pic {
				position: relative;
				text-align: center;
			}

			.pic_status {
				font-size: 43rpx;
			}

			.inquiry-receive-icon {
				font-size: 49rpx;
			}

			.inquiry-complete-icon {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 43rpx;
				height: 43rpx;
				border: 2rpx solid currentColor;
				border-radius: 50%;
				box-sizing: border-box;
				font-size: 24rpx;
				line-height: 1;
			}

			.txt {
				margin-top: 12rpx;
				font-size: 26rpx;
				color: #454545;
			}
		}

		.user-menus {
			.menu-title {
				padding: 30rpx 30rpx 24rpx;
			}

			.list-box {
				display: flex;
				flex-wrap: wrap;
				padding: 6rpx 0 0;
			}

			.item {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: space-between;
				flex-direction: column;
				width: 25%;
				margin-bottom: 47rpx;
				font-size: 26rpx;
				color: #333333;

				image {
					width: 52rpx;
					height: 52rpx;
					margin-bottom: 18rpx;
				}


				&:last-child::before {
					display: none;
				}
			}

			button {
				font-size: 28rpx;
			}
		}

		.phone {
			color: #2563eb;
		}
		.pic_status{
			font-size: 43rpx;
			@include main_color(theme);
		}
		.order-status-num {
			min-width: 13rpx;
			background-color: #fff;
			@include main_color(theme);
			border-radius: 15px;
			position: absolute;
			right: -14rpx;
			top: -15rpx;
			font-size: 20rpx;
			padding: 0 8rpx;
			@include coupons_border_color(theme);
		}
		
	}
	.sub_btn{
		width: 690rpx;
		height: 86rpx;
		line-height: 86rpx;
		margin-top: 60rpx;
		background: $theme-color;
		border-radius: 43rpx;
		color: #fff;
		font-size: 28rpx;
		text-align: center;
	}
</style>

