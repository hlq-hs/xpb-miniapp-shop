<template>
	<view class="goodCate">
		<view class="header acea-row row-center-wrapper" :style="{top: iStatusBarHeight + 'px'}">
			<navigator url="/pages/goods/goods_search/index" class="search acea-row row-center-wrapper" hover-class="none">
				<text class="iconfont icon-xiazai5"></text>
				<text class="search-placeholder">搜索商品名称</text>
				<text class="search-btn">搜索</text>
			</navigator>
		</view>
		<view class="conter" v-if="showSlide">
			<view class='aside' :style="{top: iStatusBarHeight + 'px'}">
				<view class='item acea-row row-center-wrapper' :class='index==navActive?"on":""'
					v-for="(item,index) in productList" :key="index" @click="tapNav(index,item)">
					<view class="category-icon">{{ item.name ? item.name.slice(0, 1) : '' }}</view>
					<text>{{item.name}}</text>
				</view>
			</view>
			<view class="wrapper" :style="{top: iStatusBarHeight + 'px'}">
				<view class="bgcolor" :class="{ expanded: filterExpanded }" v-if="iSlong">
					<view class="filter-title acea-row row-between-wrapper">
						<view>{{categoryTitle}}</view>
					</view>
					<view class="longTab acea-row row-middle filter-tags" :class="{ collapsed: !filterExpanded }" :style="{top: iStatusBarHeight + 'px'}">
						<scroll-view scroll-x="true" style="white-space: nowrap; display: flex;height:44rpx;" scroll-with-animation
							:scroll-left="tabLeft" show-scrollbar="true">
							<!-- <view class="longItem" :style='"width:"+isWidth+"px"'>全部</view> -->
							<view class="longItem" :style='"width:"+isWidth+"px"' :class="index===tabClick?'click':''"
								v-for="(item,index) in categoryErList" :key="index" @click="longClick(index,item)">{{item.name}}</view>
						</scroll-view>
					</view>
					<view class="filter-more" v-if="categoryErList.length > 4" @click="toggleFilter">
						<text>{{ filterExpanded ? '收起' : '更多' }}</text>
						<text class="iconfont icon-xiala" :class="{ up: filterExpanded }"></text>
					</view>
				</view>
				<view v-else>
					<view class="downTab" :style="{top: iStatusBarHeight + 'px'}">
						<view class="title acea-row row-between-wrapper">
							<view>{{categoryTitle}}</view>
							<view class="closeList" @click="closeTap"><text>收起</text><text class="iconfont icon-xiala"></text></view>
						</view>
						<view class="children">
							<view class="acea-row row-middle">
								<view class="item line1" :class="index===tabClick?'click':''" v-for="(item,index) in categoryErList"
									:key="index" @click="longClick(index,item)">{{item.name}}</view>
							</view>
						</view>
					</view>
					<view class="mask" @click="closeTap"></view>
				</view>
				<view class="list-loading" v-if="loading && !tempArr.length">
					<view class="list-loading-panel">
						<text class="list-loading-icon iconfont icon-jiazai"></text>
						<text class="list-loading-text">Loading...</text>
					</view>
				</view>
				<goodList :tempArr="tempArr" :isLogin="isLogin" :showEmptyLine="loadend && !loading" @detail="goDetail" @gocartduo="goCartDuo"></goodList>
				<view class='loadingicon acea-row row-center-wrapper mb-2'>
					<text class='loading iconfont icon-jiazai' :hidden='loading==false'></text>{{loadTitle}}
				</view>
			</view>
		</view>
		<view class="conter" v-else>
			<view class="hide_slide">
				<view class="bgcolor" :class="{ expanded: filterExpanded }" v-if="iSlong">
					<view class="filter-title acea-row row-between-wrapper">
						<view>{{categoryTitle}}</view>
					</view>
					<view class="hongTab acea-row row-middle filter-tags" :class="{ collapsed: !filterExpanded }" :style="{top: iStatusBarHeight + 'px'}">
						<scroll-view scroll-x="true" style="white-space: nowrap; display: flex;height:44rpx;" scroll-with-animation
							:scroll-left="tabLeft" show-scrollbar="true">
							<view class="longItem" :style='"width:"+isWidth+"px"' :class="index===tabClick?'click':''"
								v-for="(item,index) in productList" :key="index" @click="navSwitch(index,item)">{{item.name}}</view>
						</scroll-view>
					</view>
					<view class="filter-more" v-if="productList.length > 4" @click="toggleFilter">
						<text>{{ filterExpanded ? '收起' : '更多' }}</text>
						<text class="iconfont icon-xiala" :class="{ up: filterExpanded }"></text>
					</view>
				</view>
				<view v-else>
					<view class="hownTab" :style="{top: iStatusBarHeight + 'px'}">
						<view class="title acea-row row-between-wrapper">
							<view>{{categoryTitle}}</view>
							<view class="closeList" @click="closeTap"><text>收起</text><text class="iconfont icon-xiangxia"></text></view>
						</view>
						<view class="children">
							<view class="acea-row row-middle">
								<view class="item line1" :class="index===tabClick?'click':''" v-for="(item,index) in productList"
									:key="index" @click="navSwitch(index,item)">{{item.name}}</view>
							</view>
						</view>
					</view>
					<view class="mask" @click="closeTap"></view>
				</view>
				<view class="list-loading" v-if="loading && !tempArr.length">
					<view class="list-loading-panel">
						<text class="list-loading-icon iconfont icon-jiazai"></text>
						<text class="list-loading-text">Loading...</text>
					</view>
				</view>
				<goodList :tempArr="tempArr" :isLogin="isLogin" :showEmptyLine="loadend && !loading" @detail="goDetail" @gocartduo="goCartDuo"></goodList>
				<view class='loadingicon acea-row row-center-wrapper mb-2'>
					<text class='loading iconfont icon-jiazai' :hidden='loading==false'></text>{{loadTitle}}
				</view>
			</view>
		</view>
		<view class="footer acea-row row-between-wrapper">
			<view class="cartIcon acea-row row-center-wrapper" @click="getCartLists(0)" v-if="cartData.cartList.length">
				<text class="iconfont icon-gouwuche-yangshi1"></text>
				<view class="num"><text>{{cartCount || cartData.cartList.length}}</text></view>
			</view>
			<view class="cartIcon acea-row row-center-wrapper noCart" v-else>
				<text class="iconfont icon-gouwuche-yangshi1"></text>
			</view>
			<view class="money acea-row row-middle">
				<view>￥<text class="num">{{totalPrice}}</text></view>
				<view class="bnt gray_bg" :class="{ 'main_bg': cartCount > 0}" @click="subOrder">去结算</view>
			</view>
		</view>
		<cartList :cartData="cartData" @closeList="closeList" @ChangeCartNumDan="ChangeCartList"
			@ChangeSubDel="ChangeSubDel" @ChangeOneDel="ChangeOneDel"></cartList>
		<productWindow :attr="attr" :isShow='1' :iSplus='1' :iScart='1' @myevent="onMyEvent" @ChangeAttr="ChangeAttr"
			@ChangeCartNum="ChangeCartNumDuo" @attrVal="attrVal" @iptCartNum="iptCartNum" @goCat="goCatNum"
			id='product-window'></productWindow>
	</view>
</template>


<script>
	import {
		getCategoryList,
		getProductslist,
		getAttr,
		postCartAdd
	} from '@/api/store.js';
	import {
		getCartList,
		getCartCounts,
		cartDel,
		changeCartNum,
	} from '@/api/order.js';
	import productWindow from '@/components/productWindow';
	import goodList from '@/components/d_goodList';
	import cartList from '@/components/cartList';
	import {
		mapGetters
	} from 'vuex';
	import {
		goShopDetail
	} from '@/libs/order.js';
	import {
		toLogin
	} from '@/libs/login.js';
	import animationType from '@/utils/animationType.js'
	export default {
		computed: mapGetters(['isLogin', 'uid']),
		components: {
			productWindow,
			goodList,
			cartList
		},
		props: {
			showSlide: {
				type: Boolean,
				default: true
			},
		},
		data() {
			return {
				urlDomain: this.$Cache.get("imgHost"),
				productList: [],
				navActive: 0,
				categoryTitle: '',
				categoryErList: [],
				tabLeft: 0,
				isWidth: 0, //姣忎釜瀵艰埅鏍忓崰浣?
				tabClick: 0, //瀵艰埅鏍忚鐐瑰嚮
				iSlong: true,
				filterExpanded: false,
				tempArr: [],
				loading: false,
				loadend: false,
				loadTitle: '加载更多',
				page: 1,
				limit: 999,
				cid: 0, //涓€绾у垎绫?
				sid: 0, //浜岀骇鍒嗙被
				isAuto: false, //娌℃湁鎺堟潈鐨勪笉浼氳嚜鍔ㄦ巿鏉?
				isShowAuth: false, //鏄惁闅愯棌鎺堟潈
				attr: {
					cartAttr: false,
					productAttr: [],
					productSelect: {}
				},
				productValue: [],
				attrValue: '', //宸查€夊睘鎬?
				storeName: '', //澶氬睘鎬т骇鍝佸悕绉?
				storeInfo: {},
				id: 0,
				cartData: {
					cartList: [],
					iScart: false
				},
				cartCount: 0,
				totalPrice: 0.00,
				lengthCart: 0,
				iStatusBarHeight: 0, // 鐘舵€佹爮楂樺害
			}
		},
		created() {
			// #ifdef APP-PLUS
			this.iStatusBarHeight = uni.getSystemInfoSync().statusBarHeight;
			// #endif
			if (this.isLogin) {
				this.getCartNum();
				this.getCartLists(1);
			}
			this.getAllCategory();
			let that = this;
			that.lengthCart = that.cartData.cartList;
			// 鑾峰彇璁惧瀹藉害
			uni.getSystemInfo({
				success(e) {
					that.isWidth = e.windowWidth / 5
				}
			});
		},
		methods: {
			// 鐢熸垚璁㈠崟锛?
			subOrder: function() {
				let that = this,
					list = that.cartData.cartList,
					ids = [];
				if (list.length) {
					let shoppingCartId = list.map(item => {
						return {
							"shoppingCartId": Number(item.id)
						}
					})
					this.$Order.getPreOrder("shoppingCart", shoppingCartId);
					that.cartData.iScart = false;
				} else {
					return that.$util.Tips({
						title: '请选择产品'
					});
				}
			},
			// 璁＄畻鎬讳环锛?
			getTotalPrice: function() {
				let that = this,
					list = that.cartData.cartList,
					totalPrice = 0.00;
				list.forEach(item => {
					if (item.attrStatus) {
						totalPrice = that.$util.$h.Add(totalPrice, that.$util.$h.Mul(item.cartNum, item.vipPrice ? item
							.vipPrice : item.price));
					}
				})
				that.$set(that, 'totalPrice', totalPrice);
			},
			ChangeSubDel: function(event) {
				let that = this,
					list = that.cartData.cartList,
					ids = [];
				list.forEach(item => {
					ids.push(item.id)
				});
				cartDel(ids.join(",")).then(res => {
					that.$set(that.cartData, 'cartList', []);
					that.cartData.iScart = false;
					that.totalPrice = 0.00;
					that.page = 1;
					that.loadend = false;
					that.tempArr = [];
					that.productslist();
					that.getCartNum();
				})
			},
			ChangeOneDel: function(id, index) {
				let that = this,
					list = that.cartData.cartList;
				cartDel(id.toString()).then(res => {
					list.splice(index, 1);
					if (!list.length) {
						that.cartData.iScart = false;
						that.page = 1;
						that.loadend = false;
						that.tempArr = [];
						that.productslist();
					};
					that.getCartNum();
				})
			},
			getCartLists(iSshow) {
				let that = this;
				let data = {
					page: 1,
					limit: that.limit,
					isValid: true
				};
				getCartList(data).then(res => {
					that.$set(that.cartData, 'cartList', res.data.list);
					if (res.data.list.length) {
						that.$set(that.cartData, 'iScart', iSshow ? false : !that.cartData.iScart);
					} else {
						that.$set(that.cartData, 'iScart', false);
					}
					that.getTotalPrice();
				})
			},
			closeList(e) {
				this.$set(this.cartData, 'iScart', e);
				this.page = 1;
				this.loadend = false;
				this.tempArr = [];
				this.productslist();
			},
			getCartNum: function() {
				let that = this;
				getCartCounts(true, 'sum').then(res => {
					that.$set(that, 'cartCount', res.data.count);
				});
			},


			onMyEvent: function() {
				this.$set(this.attr, 'cartAttr', false);
			},
			/**
			 * 榛樿閫変腑灞炴€?
			 * 
			 */
			DefaultSelect: function() {
				let productAttr = this.attr.productAttr;
				let value = [];
				// 鎸?id 鍗囧簭鎺掑簭
				const sortedArray = Object.entries(this.productValue)
					.sort(([, a], [, b]) => a.id - b.id)
					.map(([key, value]) => ({
						key,
						...value
					}));
				// 榛樿瑙勬牸璁剧疆
				for (let i=0; i<sortedArray.length; i++) {
					const attrItem = sortedArray[i]
					if (attrItem.stock > 0 && attrItem.isShow) {
						if (value.length == 0) {
							value = this.attr.productAttr.length ? attrItem.key.split(",") : [];
						}
						if (attrItem.isDefault) {
							value = this.attr.productAttr.length ? attrItem.key.split(",") : [];
							break
						}
					}
				}
				// for (let key in this.productValue) {
				// 	if (this.productValue[key].stock > 0) {
				// 		value = this.attr.productAttr.length ? key.split(",") : [];
				// 		break;
				// 	}
				// }
				for (let i = 0; i < productAttr.length; i++) {
					this.$set(productAttr[i], "index", value[i]);
				}
				//sort();鎺掑簭鍑芥暟:鏁板瓧-鑻辨枃-姹夊瓧锛?
				let productSelect = this.productValue[value.join(",")];
				if (productSelect && productAttr.length) {
					this.$set(this.attr.productSelect, "storeName", this.storeName);
					this.$set(this.attr.productSelect, "image", productSelect.image);
					this.$set(this.attr.productSelect, "price", productSelect.price);
					this.$set(this.attr.productSelect, "stock", productSelect.stock);
					this.$set(this.attr.productSelect, "unique", productSelect.id);
					this.$set(this.attr.productSelect, "vipPrice", this.getVipPrice(productSelect));
					this.$set(this.attr.productSelect, "cart_num", 1);
					this.$set(this, "attrValue", value.join(","));
				} else if (!productSelect && productAttr.length) {
					this.$set(this.attr.productSelect, "storeName", this.storeName);
					this.$set(this.attr.productSelect, "image", this.storeInfo.image);
					this.$set(this.attr.productSelect, "price", this.storeInfo.price);
					this.$set(this.attr.productSelect, "stock", 0);
					this.$set(this.attr.productSelect, "unique", "");
					this.$set(this.attr.productSelect, "vipPrice", this.getVipPrice(this.storeInfo));
					this.$set(this.attr.productSelect, "cart_num", 0);
					this.$set(this, "attrValue", "");
				} else if (!productSelect && !productAttr.length) {
					this.$set(this.attr.productSelect, "storeName", this.storeName);
					this.$set(this.attr.productSelect, "image", this.storeInfo.image);
					this.$set(this.attr.productSelect, "price", this.storeInfo.price);
					this.$set(this.attr.productSelect, "stock", this.storeInfo.stock);
					this.$set(this.attr.productSelect, "unique", this.storeInfo.unique || "");
					this.$set(this.attr.productSelect, "vipPrice", this.getVipPrice(this.storeInfo));
					this.$set(this.attr.productSelect, "cart_num", 1);
					this.$set(this, "attrValue", "");
				}
			},
			/**
			 * 灞炴€у彉鍔ㄨ祴鍊?
			 * 
			 */
			ChangeAttr: function(res) {
				let productSelect = this.productValue[res];
				if (productSelect) {
					this.$set(this.attr.productSelect, "image", productSelect.image);
					this.$set(this.attr.productSelect, "price", productSelect.price);
					this.$set(this.attr.productSelect, "stock", productSelect.stock);
					this.$set(this.attr.productSelect, "unique", productSelect.id);
					this.$set(this.attr.productSelect, "cart_num", 1);
					this.$set(this.attr.productSelect, "vipPrice", this.getVipPrice(productSelect));
					this.$set(this.attr.productSelect, 'otPrice', productSelect.otPrice);
					this.$set(this.attr.productSelect, 'isShow', productSelect.isShow);
					// 鍚庡彴浼犲叆鐨勮鏍间笉灞曠ず鏃惰涓哄簱瀛樹负0
					if (!this.attr.productSelect.isShow) {
						this.$set(this.attr.productSelect, "stock", 0);
						this.$util.Tips({
							title: "请重新选择其它规格"
						});
					}
					this.$set(this, "attrValue", res);
				} else {
					this.$set(this.attr.productSelect, "price", '暂无报价');
					this.$set(this.attr.productSelect, "stock", 0);
					this.$set(this.attr.productSelect, "unique", 0);
					this.$set(this.attr.productSelect, "cart_num", 0);
					this.$set(this.attr.productSelect, "vipPrice", '暂无报价');
					this.$set(this, "attrValue", "");
				}
			},
			attrVal(val) {
				this.$set(this.attr.productAttr[val.indexw], 'index', this.attr.productAttr[val.indexw].attrValues[val
					.indexn]);
			},
			getVipPrice(item) {
				item = item || {};
				return item.vipPrice || item.vip_price || this.storeInfo.vipPrice || this.storeInfo.vip_price || 0;
			},
			/**
			 * 璐墿杞︽墜鍔ㄥ～鍐?
			 * 
			 */
			iptCartNum: function(e) {
				this.$set(this.attr.productSelect, 'cart_num', e);
			},
			onLoadFun() {},
			// 浜у搧鍒楄〃
			productslist: function() {
				let that = this;
				if (that.loadend) return; //濡傛灉杩斿洖鍒楄〃闀垮害灏忎簬璇锋眰鍒嗛〉闀垮害锛屽氨璁╀粬涓簍rue,灏变笉缁х画璇锋眰浜?
				if (that.loading) return;
				that.loading = true;
				that.loadTitle = '';
				getProductslist({
					page: that.page,
					limit: that.limit,
					type: 1,
					cid: that.sid
				}).then(res => {
					let data = res.data || res;
					let list = Array.isArray(data.list) ? data.list : [];
					let loadend = list.length < that.limit; //返回列表长度小于请求分页长度为true,反之为false
					let tempArr = that.page === 1 ? list : that.tempArr.concat(list);
					that.$set(that, 'tempArr', tempArr);
					that.loading = false;
					that.loadend = loadend;
					that.loadTitle = loadend ? "我也是有底线的~" : "加载更多";
					that.page = that.page + 1;
				}).catch(err => {
					that.loading = false,
						that.loadTitle = '加载更多'
				});
			},
			// 鏀瑰彉澶氬睘鎬ц喘鐗╄溅
			ChangeCartNumDuo(changeValue) {
				//changeValue:鏄惁 鍔爘鍑?
				//鑾峰彇褰撳墠鍙樺姩灞炴€?
				let productSelect = this.productValue[this.attrValue];
				//濡傛灉娌℃湁灞炴€?璧嬪€肩粰鍟嗗搧榛樿搴撳瓨
				if (productSelect === undefined && !this.attr.productAttr.length)
					productSelect = this.attr.productSelect;
				//鏃犲睘鎬у€煎嵆搴撳瓨涓?锛涗笉瀛樺湪鍔犲噺锛?
				if (productSelect === undefined) return;
				let stock = productSelect.stock || 0;
				let num = this.attr.productSelect;
				if (changeValue) {
					num.cart_num++;
					if (num.cart_num > stock) {
						this.$set(this.attr.productSelect, "cart_num", stock);
						this.$set(this, "cart_num", stock);
					}
				} else {
					num.cart_num--;
					if (num.cart_num < 1) {
						this.$set(this.attr.productSelect, "cart_num", 1);
						this.$set(this, "cart_num", 1);
					}
				}

			},
			// 宸茬粡鍔犲叆璐墿杞︽椂鐨勮喘鐗╁姞鍑忥紱
			ChangeCartList(changeValue, index) {
				let list = this.cartData.cartList;
				let num = list[index];
				let stock = list[index].stock;
				this.ChangeCartNum(changeValue, num, stock, 0, num.productId, index, 1);
				if (!list.length) {
					this.cartData.iScart = false;
					this.page = 1;
					this.loadend = false;
					this.tempArr = [];
					this.productslist();
				}
			},
			// 璐墿杞﹀姞鍑忚绠楀嚱鏁?
			ChangeCartNum: function(changeValue, index) {
				if (changeValue) {
					if (index.cartNum >= index.stock) {
						index.cartNum = index.stock;
					} else {
						index.cartNum++;
						changeCartNum(index.id, index.cartNum).then(res => {
							this.getCartNum(true);
							this.getTotalPrice();
						});
					}
				} else {
					if (Number(index.cartNum) <= 1) {
						let cartId = index.id;
						let list = this.cartData.cartList;
						let cartIndex = list.findIndex(item => item.id === cartId);
						if (cartIndex !== -1) {
							list.splice(cartIndex, 1);
						}
						this.getTotalPrice();
						if (!list.length) {
							this.cartData.iScart = false;
							this.page = 1;
							this.loadend = false;
							this.tempArr = [];
							this.productslist();
						}
						cartDel(cartId).then(res => {
							this.getCartLists(1);
							this.getTotalPrice();
							this.productslist();
							this.getCartNum();
						})
						return;
					}
					index.cartNum--;
					changeCartNum(index.id, index.cartNum).then(res => {
						this.getCartNum(true);
						this.getTotalPrice();
					});
				}
			},
			// 澶氳鏍煎姞鍏ヨ喘鐗╄溅锛?
			goCatNum() {
				this.goCat(1);
			},
			/*
			 * 鍔犲叆璐墿杞?
			 */
			goCat: function(num) {
				let that = this,
					productSelect = that.productValue[this.attrValue];
				//鎵撳紑灞炴€?
				if (that.attrValue) {
					//榛樿閫変腑浜嗗睘鎬э紝浣嗘槸娌℃湁鎵撳紑杩囧睘鎬у脊绐楄繕鏄嚜鍔ㄦ墦寮€璁╃敤鎴锋煡鐪嬮粯璁ら€変腑鐨勫睘鎬?
					that.attr.cartAttr = !that.isOpen ? true : false;
				} else {
					if (that.isOpen) that.attr.cartAttr = true;
					else that.attr.cartAttr = !that.attr.cartAttr;
				}
				//鍙湁鍏抽棴灞炴€у脊绐楁椂杩涜鍔犲叆璐墿杞?
				//濡傛灉鏈夊睘鎬?娌℃湁閫夋嫨,鎻愮ず鐢ㄦ埛閫夋嫨
				if (
					that.attr.productAttr.length &&
					productSelect.stock === 0 &&
					that.isOpen === true
				)
					return that.$util.Tips({
						title: "产品库存不足，请选择其它规格"
					});
				if (num === 1) {
					let q = {
						productId: parseFloat(that.id),
						cartNum: parseFloat(that.attr.productSelect.cart_num),
						isNew: false,
						productAttrUnique: that.attr.productSelect !== undefined ?
							that.attr.productSelect.unique : that.productInfo.id
					};
					postCartAdd(q).then(function(res) {
							that.isOpen = false;
							that.attr.cartAttr = false;
							that.$util.Tips({
								title: "添加购物车成功",
								success: () => {
									that.getCartNum(true);
									setTimeout(() => {
										that.getCartLists(1);
									}, 200)
								}
							});
						})
						.catch(res => {
							that.isOpen = false;
							return that.$util.Tips({
								title: res
							});
						});
				} else {
					this.getPreOrder();
				}
			},
			goCartDuo(item) {
				if (!this.isLogin) {
					this.getIsLogin();
				} else {
					uni.showLoading({
						title: '加载中'
					});
					this.storeName = item.storeName;
					this.getAttrs(item.id, item.storeName);
					this.$set(this, 'id', item.id);
				}
			},
			getIsLogin() {
				toLogin();
			},
			// 鍟嗗搧璇︽儏鎺ュ彛锛?
			getAttrs(id) {
				let that = this;
				getAttr(id).then(res => {
					uni.hideLoading();
					that.$set(that, 'storeInfo', res.data.productInfo || {});
					that.$set(that.attr, 'productAttr', res.data.productAttr);
					that.$set(that, 'productValue', res.data.productValue);
					let productAttr = that.attr.productAttr.map(item => {
						return {
							attrName: item.attrName,
							attrValues: item.attrValues.split(','),
							id: item.id,
							isDel: item.isDel,
							productId: item.productId,
							type: item.type,
							optionList: item.optionList || [],
							isShowImage: item.isShowImage
						}
					});
					this.$set(that.attr, 'productAttr', productAttr);
					this.$set(that.attr, 'cartAttr', true);
					that.DefaultSelect();
				})
			},
			// 鍘昏鎯呴〉
			goDetail(item) {
				goShopDetail(item, this.uid).then(res => {
					uni.navigateTo({
						animationType: animationType.type,
						animationDuration: animationType.duration,
						url: `/pages/goods/goods_details/index?id=${item.id}`
					});
				});
			},


			openTap() {
				this.iSlong = false
			},
			closeTap() {
				this.iSlong = true
			},
			toggleFilter() {
				this.filterExpanded = !this.filterExpanded;
			},
			getAllCategory: function() {
				let that = this;
				getCategoryList().then(res => {
					res.data.forEach((item) => {
						if (item.child) {
							item.child.unshift({
								id: item.id,
								name: '全部'
							})
						}
					})
					let data = res.data;
					that.categoryTitle = data[0].name;
					that.sid = data[0].id;
					that.productList = data;
					let pid = uni.getStorageSync('categoryId');
					if (pid) {
						let indexNow = that.productList.findIndex(item => item.id == pid)
						let item = that.productList.find(item => item.id == pid)
						this.tapNav(indexNow, item)
						uni.removeStorageSync('categoryId');
					}
					that.categoryErList = res.data[0].child ? res.data[0].child : [];
					that.page = 1;
					that.loadend = false;
					that.tempArr = [];
					that.productslist();
				})
			},
			tapNav(index, item) {
				let list = this.productList[index];
				this.navActive = index;
				this.categoryTitle = list.name;
				this.categoryErList = item.child ? item.child : [];
				this.tabClick = 0;
				this.tabLeft = 0;
				this.filterExpanded = false;
				// this.cid = list.id;
				this.sid = item.id;
				this.page = 1;
				this.loadend = false;
				this.tempArr = [];
				this.productslist();
			},
			navSwitch(index, item) {
				if (this.productList.length > 3) {
					this.tabLeft = (index - 1) * (this.isWidth + 6) //璁剧疆涓嬪垝绾夸綅缃?
				};
				this.tabClick = index; //璁剧疆瀵艰埅鐐瑰嚮浜嗗摢涓€涓?
				this.iSlong = true;
				this.filterExpanded = false;
				this.sid = item.id;
				this.page = 1;
				this.loadend = false;
				this.tempArr = [];
				this.productslist();
			},
			// 瀵艰埅鏍忕偣鍑?
			longClick(index, item) {
				if (this.productList.length > 3) {
					this.tabLeft = (index - 1) * (this.isWidth + 6) //璁剧疆涓嬪垝绾夸綅缃?
				};
				this.tabClick = index; //璁剧疆瀵艰埅鐐瑰嚮浜嗗摢涓€涓?
				this.iSlong = true;
				this.filterExpanded = false;
				this.sid = item.id;
				this.page = 1;
				this.loadend = false;
				this.tempArr = [];
				this.productslist();
			},
		},
	}
</script>

<style lang="scss">
	page {
		background-color: #fff;
	}

	::-webkit-scrollbar {
		width: 0;
		height: 0;
		color: transparent;
		display: none;
	}

	.goodCate {
		background-color: $crmeb-bg-color;

		.mask {
			// z-index: 99; 
		}

		/deep/.attrProduct {
			.mask {
				z-index: 100;
			}
		}

		.header {
			position: fixed;
			height: 128rpx;
			background-color: #fff;
			top: 0;
			left: 0;
			width: 100%;
			z-index: 99;
			border-bottom: 1px solid #F0F0F0;

			.pageIndex {
				width: 68rpx;
				height: 68rpx;
				border-radius: 50%;
				background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
				text-align: center;
				line-height: 68rpx;

				.iconfont {
					color: #fff;
					font-size: 30rpx;
				}
			}

			.search {
				width: 600rpx;
				/* #ifdef MP || APP-PLUS */
				width: 550rpx;
				/* #endif */
				height: 68rpx;
				border-radius: 36rpx;
				background-color: #F8F8F8;
				font-size: 26rpx;
				color: #ADADAD;
				margin-left: 22rpx;

				.iconfont {
					font-size: 30rpx;
					margin: 4rpx 16rpx 0 0;
				}
			}
		}

		.conter {
			padding-top: 64px;
			box-sizing: border-box;

			.aside {
				position: fixed;
				width: 23%;
				left: 0;
				bottom: 0;
				top: 0;
				background-color: $crmeb-bg-color-grey;
				overflow-y: auto;
				overflow-x: hidden;
				margin-top: 128rpx;
				z-index: 99;
				padding-bottom: 140rpx;

				.item {
					height: 100rpx;
					width: 100%;
					font-size: 26rpx;
					color: $crmeb-font-color;

					&.on {
						background-color: $crmeb-bg-color;
						width: 100%;
						text-align: center;
						color: #2563eb;
						font-weight: 500;
						position: relative;

						&::after {
							content: "";
							position: absolute;
							width: 6rpx;
							height: 46rpx;
							background: #2563eb;
							border-radius: 0 4rpx 4rpx 0;
							left: 0
						}
					}
				}
			}
		}

		.wrapper {
			position: relative;
			margin-top: 0;
			padding-top: 0;
			width: 77%;
			float: right;
			background-color: #fff;
			padding-bottom: 130rpx;
		}

		.hide_slide {
			margin-top: 0;
			width: 100%;
			float: right;
			background-color: #fff;
			padding-top: 0;
			padding-bottom: 130rpx;
		}

		.bgcolor {
			width: 100%;
			background-color: #fff;
			height: 44rpx;
			position: relative;
			z-index: 99;
			display: flex;
			align-items: center;
		}

		.goodsList {
			margin-top: 0 !important;
		}

		.longTab {
			width: 88%;
			position: static;
			margin-top: 0;
			height: 44rpx;
			background-color: #fff;
		}

		.hongTab {
			width: 88%;
			position: static;
			margin-top: 0;
			height: 44rpx;
			background-color: #fff;
		}

		.longItem {
			height: 44rpx;
			display: inline-block;
			line-height: 44rpx;
			text-align: center;
			font-size: 26rpx;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: $crmeb-font-color;
			background-color: $crmeb-bg-color-grey;
			border-radius: 22rpx;
			margin-left: 12rpx;

			&.click {
				font-weight: bold;
				background: #dbeafe;
				color: #2563eb;
			}
		}

		.underlineBox {
			height: 3px;
			width: 20%;
			display: flex;
			align-content: center;
			justify-content: center;
			transition: .5s;

			.underline {
				width: 33rpx;
				height: 4rpx;
				background-color: $crmeb-bg-color;
			}
		}

		.openList {
			width: 12%;
			height: 44rpx;
			background-color: #fff;
			line-height: 44rpx;
			padding-left: 0;
			margin-top: 0;
			position: static;
			text-align: center;
			// top: 128rpx;

			.iconfont {
				font-size: 22rpx;
				color: $crmeb-font-color-subtitle;
			}
		}

		.downTab {
			width: 77%;
			position: fixed;
			top: 0;
			margin-top: 128rpx;
			z-index: 99;
			background-color: #fff;
			right: 0;
		}

		.hownTab {
			width: 100%;
			position: fixed;
			top: 0;
			margin-top: 128rpx;
			z-index: 99;
			background-color: #fff;
			right: 0;
		}

		.title {
			font-size: 26rpx;
			color: $crmeb-font-color-assist;
			// padding-left: 20rpx;

			.closeList {
				width: 90rpx;
				height: 100%;
				line-height: 100rpx;
				padding-left: 30rpx;
				transform: rotate(180deg);

				.iconfont {
					font-size: 22rpx;
					color: $crmeb-font-color-subtitle;
				}
			}
		}

		.children {
			max-height: 500rpx;
			overflow-x: hidden;
			overflow-y: auto;
			padding-bottom: 20rpx;

			.item {
				height: 60rpx;
				background-color: $crmeb-bg-color-grey;
				border-radius: 30rpx;
				line-height: 60rpx;
				padding: 0 15rpx;
				margin: 0 0 20rpx 20rpx;
				width: 165rpx;
				text-align: center;

				&.click {
					font-weight: bold;
					background: #dbeafe;
					color: #2563eb;
				}
			}
		}

		.list_prod {
			padding: 0 30rpx;

			.item {
				width: 100%;
				box-sizing: border-box;
				margin-bottom: 20rpx;

				.pic {
					width: 690rpx;
					height: 284rpx;
					margin: auto;
					border-radius: 16rpx;
					position: relative;
					background-color: #fff;
					overflow: hidden;

					image {
						width: 100%;
						height: 100%;
						border-radius: 16rpx;
					}
				}

				.pictxt {
					width: 100%;

					.text {
						font-size: 30rpx;
						font-family: PingFang SC;
						font-weight: bold;
						color: #282828;
						margin: 20rpx 0;
					}

					.bottom {
						.money {
							font-size: 42rpx;
							font-weight: bold;
							margin-right: 18rpx;
							@include price_color(theme);

							.sign {
								font-size: 26rpx;
							}

							.item_sales {
								font-size: 24rpx;
								font-family: PingFang SC;
								font-weight: 400;
								padding-left: 17rpx;
								color: #8e8e8e;
							}
						}

						.cart {
							height: 56rpx;

							.pictrue {
								color: #2563eb;
								font-size: 46rpx;
								width: 50rpx;
								height: 50rpx;
								text-align: center;
								line-height: 50rpx;

								&.icon-jiahao {
									background: linear-gradient(140deg, #3b82f6 0%, #2563eb 100%);
									-webkit-background-clip: text;
									-webkit-text-fill-color: transparent;
								}
							}

							.num {
								font-size: 30rpx;
								color: #282828;
								font-weight: bold;
								width: 80rpx;
								text-align: center;
							}
						}

						.bnt {
							padding: 0 30rpx;
							height: 56rpx;
							line-height: 56rpx;
							background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
							border-radius: 42rpx;
							font-size: 26rpx;
							color: #fff;
							position: relative;

							.num {
								color: #2563eb;
								border: 1rpx solid #2563eb;
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
							padding: 0 30rpx;
							height: 56rpx;
							line-height: 56rpx;
							border-radius: 42rpx;
							font-size: 26rpx;
							color: #fff;
							position: relative;
							background: rgba(203, 203, 203, 1);
						}
					}
				}
			}
		}

		.footer {
			position: fixed;
			left: 0;
			bottom: env(safe-area-inset-bottom);
			width: 100%;
			background-color: #fff;
			box-shadow: 0px -3rpx 16rpx rgba(36, 12, 12, 0.05);
			z-index: 101;
			padding: 0 30rpx;
			box-sizing: border-box;
			height: 100rpx;

			&:after {
				content: '';
				height: env(safe-area-inset-bottom); // 杩欓噷鏄噸鐐?
				position: absolute;
				top: 100%;
				left: 0;
				right: 0;
				background-color: #fff;
			}

			.cartIcon {
				width: 96rpx;
				height: 96rpx;
				background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
				border-radius: 50%;
				position: relative;
				margin-top: -36rpx;

				&.noCart {
					background: #CBCBCB !important;
				}

				.iconfont {
					color: #fff;
					font-size: 54rpx;
					line-height: 1;
				}

				.num {
					min-width: 12rpx;
					color: #fff;
					border-radius: 15px;
					position: absolute;
					right: -6rpx;
					top: -10rpx;
					font-size: 22rpx;
					padding: 0 10rpx;
					height: 34rpx;
					line-height: 34rpx;
					@include main_color(theme);
					@include coupons_border_color(theme);
					background-color: #fff;
				}
			}

			.money {
				@include price_color(theme);
				font-size: 28rpx;
				font-weight: bold;

				.num {
					font-size: 42rpx;
				}

				.bnt {
					width: 222rpx;
					height: 76rpx;
					border-radius: 46rpx;
					line-height: 76rpx;
					text-align: center;
					color: #fff;
					margin-left: 24rpx;
				}

				.main_bg {
					background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
				}

				.gray_bg {
					background-color: #B3B3B4;
				}

			}
		}

		.header {
			height: 142rpx;
			border-bottom: 0;
			box-shadow: none;
			z-index: 200;

			.search {
				justify-content: flex-start;
				width: 690rpx;
				height: 70rpx;
				margin-left: 0;
				padding-left: 28rpx;
				padding-right: 8rpx;
				box-sizing: border-box;
				border-radius: 40rpx;
				background: #f5f7fb;
				color: #9aa3af;
				font-size: 28rpx;

				.iconfont {
					margin: 0 18rpx 0 0;
					color: #9aa3af;
				}

				.search-placeholder {
					flex: 1;
				}

				.search-btn {
					width: 112rpx;
					height: 58rpx;
					border-radius: 32rpx;
					line-height: 58rpx;
					text-align: center;
					color: #fff;
					font-size: 28rpx;
					font-weight: 700;
					background: linear-gradient(90deg, #3d82ff 0%, #2563eb 100%);
				}
			}
		}

		.conter {
			min-height: 100vh;
			padding-top: 142rpx;
			background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);

			.aside {
				width: 27%;
				margin-top: 142rpx;
				padding: 22rpx 10rpx 180rpx 6rpx;
				box-sizing: border-box;
				background: rgba(248, 251, 255, 0.92);

				.item {
					justify-content: flex-start;
					height: 86rpx;
					margin-bottom: 18rpx;
					padding: 0 10rpx 0 18rpx;
					box-sizing: border-box;
					border-radius: 0 22rpx 22rpx 0;
					color: #606875;
					font-size: 25rpx;
					overflow: visible;

					text {
						flex: 1;
						min-width: 0;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.category-icon {
						width: 42rpx;
						height: 42rpx;
						margin-right: 12rpx;
						border-radius: 50%;
						line-height: 42rpx;
						text-align: center;
						color: #9aa3af;
						font-size: 22rpx;
						background: #fff;
						box-shadow: 0 8rpx 20rpx rgba(45, 101, 202, 0.08);
					}

					&.on {
						width: 100%;
						background: linear-gradient(90deg, #3d82ff 0%, #2563eb 100%);
						color: #fff;
						font-weight: 700;
						box-shadow: 0 14rpx 30rpx rgba(37, 99, 235, 0.22);

						.category-icon {
							color: #2563eb;
							background: rgba(255, 255, 255, 0.96);
						}

						&::after {
							display: none;
						}
					}
				}
			}
		}

		.wrapper {
			width: 73%;
			min-height: calc(100vh - 142rpx);
			background: transparent;
			padding-bottom: 180rpx;
		}

		.wrapper > .loadingicon {
			display: none;
		}

		.list-loading {
			position: absolute;
			left: 0;
			right: 0;
			top: 190rpx;
			z-index: 20;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			pointer-events: none;

			.list-loading-panel {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: 160rpx;
				height: 160rpx;
				border-radius: 8rpx;
				background: rgba(0, 0, 0, 0.68);
			}

			.list-loading-icon {
				flex: 0 0 auto;
				margin-bottom: 22rpx;
				font-size: 46rpx;
				line-height: 46rpx;
				color: rgba(255, 255, 255, 0.88);
				animation: list-loading-rotate 1s linear infinite;
			}

			.list-loading-text {
				flex: 0 0 auto;
				white-space: nowrap;
				line-height: 28rpx;
				font-size: 26rpx;
				color: #fff;
			}
		}

		@keyframes list-loading-rotate {
			from {
				transform: rotate(0deg);
			}

			to {
				transform: rotate(360deg);
			}
		}

		.bgcolor {
			height: auto;
			margin: 0 20rpx 18rpx;
			padding: 18rpx 18rpx 8rpx;
			box-sizing: border-box;
			border-radius: 8rpx;
			overflow: visible;
			background: #fff;
			box-shadow: 0 8rpx 24rpx rgba(34, 89, 173, 0.06);
			display: block;
			align-items: initial;
			z-index: 2;
		}

		.filter-title {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			height: 40rpx;
			margin-bottom: 18rpx;
			font-size: 24rpx;
			font-weight: 600;
			color: #1f2937;
		}

		.filter-toggle {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			height: 40rpx;
			line-height: 40rpx;
			font-size: 22rpx;
			font-weight: 400;
			color: #4b5563;

			.iconfont {
				margin-left: 8rpx;
				font-size: 20rpx;
				color: #4b5563;
				transform: rotate(180deg);
			}
		}

		.longTab {
			display: block;
			width: 100%;
			height: auto;
			background: transparent;
		}

		.hongTab {
			display: block;
			width: 100%;
			height: auto;
			background: transparent;
		}

		.longTab scroll-view,
		.hongTab scroll-view {
			height: auto !important;
			white-space: normal !important;
		}

		.filter-tags {
			overflow: hidden;
		}

		.filter-tags.collapsed {
			max-height: 110rpx;
		}

		.bgcolor.expanded .filter-tags {
			max-height: 220rpx;
			overflow-y: auto;
		}

		.filter-more {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			height: 38rpx;
			margin-top: -2rpx;
			font-size: 22rpx;
			color: #4b5563;

			.iconfont {
				margin-left: 8rpx;
				font-size: 18rpx;
				color: #4b5563;
			}

			.iconfont.up {
				transform: rotate(180deg);
			}
		}

		.longItem {
			width: auto !important;
			min-width: 76rpx;
			height: 42rpx;
			line-height: 42rpx;
			margin: 0 12rpx 10rpx 0;
			padding: 0 20rpx;
			box-sizing: border-box;
			border-radius: 21rpx;
			background: #f5f7fb;
			color: #4b5563;
			font-size: 22rpx;
			font-weight: 500;

			&.click {
				background: linear-gradient(90deg, #3d82ff 0%, #2563eb 100%);
				color: #fff;
				font-weight: 700;
			}
		}

		.openList {
			position: absolute;
			right: 12rpx;
			top: 12rpx;
			width: 40rpx;
			height: 40rpx;
			line-height: 40rpx;
			background: transparent;
		}

		.downTab,
		.hownTab {
			position: relative;
			right: auto;
			top: auto;
			width: auto;
			margin: 0 20rpx 18rpx;
			padding: 18rpx 18rpx 8rpx;
			box-sizing: border-box;
			border-radius: 8rpx;
			background: #fff;
			box-shadow: 0 8rpx 24rpx rgba(34, 89, 173, 0.06);
			z-index: 101;

			.title {
				height: 40rpx;
				margin-bottom: 18rpx;
				font-size: 24rpx;
				font-weight: 600;
				color: #1f2937;

				.closeList {
					display: flex;
					align-items: center;
					justify-content: flex-end;
					width: 96rpx;
					height: 40rpx;
					line-height: 40rpx;
					padding-left: 0;
					transform: none;
					font-size: 22rpx;
					font-weight: 400;
					color: #4b5563;

					.iconfont {
						margin-left: 8rpx;
						font-size: 20rpx;
						color: #4b5563;
						transform: rotate(180deg);
					}
				}
			}

			.children {
				max-height: 172rpx;
				padding-bottom: 0;
				overflow-x: hidden;
				overflow-y: auto;

				.item {
					width: auto;
					min-width: 76rpx;
					height: 42rpx;
					line-height: 42rpx;
					margin: 0 12rpx 12rpx 0;
					padding: 0 20rpx;
					box-sizing: border-box;
					border-radius: 21rpx;
					background: #f5f7fb;
					color: #4b5563;
					font-size: 22rpx;
					font-weight: 500;
					text-align: center;

					&.click {
						background: linear-gradient(90deg, #3d82ff 0%, #2563eb 100%);
						color: #fff;
						font-weight: 700;
					}
				}
			}
		}

		.hownTab {
			left: auto;
			right: auto;
			width: auto;
		}

		.mask {
			background: transparent !important;
		}

		.footer {
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 128rpx;
			padding: 0 30rpx;
			border-radius: 0;
			background: #fff;
			box-shadow: 0 -3rpx 16rpx rgba(36, 12, 12, 0.05);

			&:after {
				display: none;
			}

			.cartIcon {
				width: 72rpx;
				height: 72rpx;
				margin-top: 0;
				background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
				box-shadow: none;

				&.noCart {
					background: #cbcbcb !important;
					box-shadow: none;
				}

				.iconfont {
					font-size: 44rpx;
				}

				.num {
					right: -8rpx;
					top: -10rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					min-width: 34rpx;
					height: 34rpx;
					padding: 0 8rpx;
					box-sizing: border-box;
					border-radius: 18rpx;
					line-height: 34rpx;
					font-size: 22rpx;
					font-weight: 700;
					color: #fff;
					border: 0;
					background: #f21f22;
					text-align: center;
					z-index: 3;

					text {
						display: block;
						color: #fff;
						font-size: 22rpx;
						font-weight: 700;
						line-height: 34rpx;
					}
				}
			}

			.money {
				font-size: 28rpx;

				.num {
					font-size: 42rpx;
				}

				.bnt {
					width: 190rpx;
					height: 64rpx;
					line-height: 64rpx;
					font-size: 28rpx;
					font-weight: 700;
					border-radius: 36rpx;
				}

				.main_bg {
					background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
				}
			}
		}
	}
</style>






