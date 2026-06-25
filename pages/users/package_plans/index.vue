<template>
	<view class="plans-page">
		<view v-if="loading" class="loading-mask">
			<view class="loading-card">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<view v-if="errorMessage" class="error-card">
			<text class="error-title">加载失败</text>
			<text class="error-text">{{ errorMessage }}</text>
		</view>

		<view v-if="hasPlans" class="plan-list">
			<view
				v-for="(item, index) in renderPlans"
				:key="index"
				class="plan-card"
				:class="item.sceneClass"
			>
				<view class="plan-title-row">
					<view class="title-accent"></view>
					<text class="plan-title">{{ item.title }}</text>
				</view>

				<view class="plan-content">
					<view class="stats-row">
						<view class="stat-item">
							<view class="stat-icon-wrap">
								<text class="iconfont stat-icon icon-gouwuche8"></text>
							</view>
							<text class="stat-label">购买</text>
							<text class="stat-value">{{ item.buyCount }}</text>
						</view>

						<view class="stat-divider"></view>

						<view class="stat-item">
							<view class="stat-icon-wrap">
								<text class="iconfont stat-icon icon-huodong-shijian"></text>
							</view>
							<text class="stat-label">使用</text>
							<text class="stat-value">{{ item.usedCount }}</text>
						</view>

						<view class="stat-divider"></view>

						<view class="stat-item">
							<view class="stat-icon-wrap">
								<text class="iconfont stat-icon icon-ic_returnmoney"></text>
							</view>
							<text class="stat-label">剩余</text>
							<text class="stat-value">{{ item.remainCount }}</text>
						</view>
					</view>

					<view class="scene-panel">
						<view class="scene-circle">
							<text class="scene-emoji">{{ item.sceneSymbol }}</text>
						</view>
						<text class="scene-caption">{{ item.sceneCaption }}</text>
					</view>
				</view>
			</view>
		</view>

		<view v-else-if="!loading && !errorMessage" class="empty-card">
			<text class="empty-text">暂无数据</text>
		</view>
	</view>
</template>

<script>
import { getPackagePlans } from '@/api/user.js';

export default {
	data() {
		return {
			saleNo: '',
			shopId: '',
			planList: [],
			renderPlans: [],
			planCount: 0,
			hasPlans: false,
			loading: false,
			errorMessage: ''
		};
	},
	onLoad(options) {
		this.saleNo = String((options && options.saleNo) || '').trim();
		this.shopId = String((options && options.shopId) || '').trim();
		this.fetchPackagePlans();
	},
	methods: {
		async fetchPackagePlans() {
			if (!this.saleNo) {
				this.errorMessage = '缺少 saleNo';
				return;
			}
			if (!this.shopId) {
				this.errorMessage = '缺少 shopId';
				return;
			}
			this.loading = true;
			this.errorMessage = '';
			this.planList = [];
			this.renderPlans = [];
			this.planCount = 0;
			this.hasPlans = false;
			try {
				const res = await getPackagePlans(this.saleNo, this.shopId);
				const payload = this.extractPayload(res);
				const list = Array.isArray(payload) ? payload.slice() : [];
				this.planList = list;
				this.renderPlans = list.map((item, index) => this.createRenderPlan(item, index));
				this.planCount = list.length;
				this.hasPlans = list.length > 0;
			} catch (error) {
				this.planList = [];
				this.renderPlans = [];
				this.planCount = 0;
				this.hasPlans = false;
				this.errorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || '请求失败';
			} finally {
				this.loading = false;
			}
		},
		extractPayload(res) {
			if (res && Object.prototype.hasOwnProperty.call(res, 'data')) {
				return res.data;
			}
			return res;
		},
		createRenderPlan(item, index) {
			const title = this.formatValue(item && item.jobName);
			const buyCount = this.formatCount(this.getNumericValue(item, 'beginNum'));
			const remainCount = this.formatCount(this.getNumericValue(item, 'packNum'));
			const usedCount = this.formatCount(this.getUsedCount(item));
			const sceneClass = this.getSceneClassByName(title);
			return {
				key: `${title}-${index}`,
				title,
				buyCount,
				usedCount,
				remainCount,
				sceneClass,
				sceneSymbol: this.getSceneSymbolByClass(sceneClass),
				sceneCaption: this.getSceneCaptionByClass(sceneClass)
			};
		},
		getUsedCount(item) {
			const buyCount = this.getNumericValue(item, 'beginNum');
			const remainCount = this.getNumericValue(item, 'packNum');
			if (buyCount === null || remainCount === null) {
				return '-';
			}
			return Math.max(buyCount - remainCount, 0);
		},
		getSceneClassByName(name) {
			if (name.includes('检测') || name.includes('安全') || name.includes('匹配')) {
				return 'scene-type-shield';
			}
			if (name.includes('机油') || name.includes('油格') || name.includes('滤芯')) {
				return 'scene-type-oil';
			}
			if (name.includes('工时') || name.includes('保养') || name.includes('维修')) {
				return 'scene-type-maintain';
			}
			if (name.includes('护') || name.includes('洗车') || name.includes('HX6') || name.includes('嘉护')) {
				return 'scene-type-suv';
			}
			return 'scene-type-shield';
		},
		getSceneSymbolByClass(sceneClass) {
			if (sceneClass === 'scene-type-oil') {
				return '油';
			}
			if (sceneClass === 'scene-type-maintain') {
				return '养';
			}
			if (sceneClass === 'scene-type-suv') {
				return '车';
			}
			return '检';
		},
		getSceneCaptionByClass(sceneClass) {
			if (sceneClass === 'scene-type-oil') {
				return '机油养护';
			}
			if (sceneClass === 'scene-type-maintain') {
				return '保养服务';
			}
			if (sceneClass === 'scene-type-suv') {
				return '爱车护理';
			}
			return '安全检测';
		},
		getNumericValue(item, key) {
			const value = item && Object.prototype.hasOwnProperty.call(item, key) ? item[key] : '';
			if (value === '' || value === null || value === undefined) {
				return null;
			}
			const num = Number(value);
			return Number.isNaN(num) ? null : num;
		},
		formatCount(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			const num = Number(value);
			if (Number.isNaN(num)) {
				return String(value);
			}
			return String(num);
		},
		formatValue(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			if (typeof value === 'object') {
				try {
					return JSON.stringify(value);
				} catch (error) {
					return String(value);
				}
			}
			return String(value);
		}
	}
};
</script>

<style scoped lang="scss">
.plans-page {
	min-height: 100vh;
	padding: 18rpx 18rpx 32rpx;
	background:
		radial-gradient(circle at top right, rgba(96, 165, 250, 0.14), rgba(96, 165, 250, 0) 24%),
		linear-gradient(180deg, #edf4ff 0%, #f7faff 44%, #edf3ff 100%);
	box-sizing: border-box;
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(243, 247, 255, 0.72);
	backdrop-filter: blur(4px);
}

.loading-card,
.error-card,
.empty-card,
.plan-card {
	background: rgba(255, 255, 255, 0.98);
	border-radius: 34rpx;
	border: 1rpx solid rgba(224, 232, 255, 0.9);
	box-shadow: 0 28rpx 70rpx rgba(87, 124, 182, 0.14);
}

.loading-card {
	width: 180rpx;
	height: 180rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.loading-spinner {
	width: 52rpx;
	height: 52rpx;
	border: 5rpx solid #dbeafe;
	border-top-color: #2563eb;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #475569;
}

.error-card,
.empty-card,
.plan-card {
	padding: 28rpx 30rpx 30rpx;
}

.error-card,
.empty-card {
	text-align: center;
}

.error-card {
	margin-bottom: 18rpx;
}

.empty-card {
	margin-top: 12rpx;
	padding-top: 40rpx;
	padding-bottom: 40rpx;
}

.plan-card + .plan-card {
	margin-top: 18rpx;
}

.plan-title-row {
	display: flex;
	align-items: center;
}

.plan-title {
	margin-left: 18rpx;
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.2;
	color: #0c1b56;
}

.title-accent {
	width: 10rpx;
	height: 62rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, #2372ff 0%, #0f5de9 100%);
}

.plan-content {
	min-height: 252rpx;
	margin-top: 22rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 20rpx;
}

.stats-row {
	flex: 1;
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
}

.stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-icon-wrap {
	width: 78rpx;
	height: 78rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(180deg, #edf4ff 0%, #e2eeff 100%);
	box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 0.9);
}

.stat-icon {
	font-size: 34rpx;
	color: #2372ff;
}

.stat-label {
	margin-top: 12rpx;
	font-size: 20rpx;
	color: #667085;
}

.stat-value {
	margin-top: 12rpx;
	font-size: 56rpx;
	font-weight: 700;
	line-height: 1;
	color: #0c1b56;
}

.stat-divider {
	width: 1rpx;
	height: 130rpx;
	margin: 0 2rpx 8rpx;
	background: linear-gradient(180deg, rgba(226, 232, 240, 0) 0%, #e8edf5 16%, #e8edf5 84%, rgba(226, 232, 240, 0) 100%);
}

.scene-panel {
	width: 180rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.scene-circle {
	width: 132rpx;
	height: 132rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(180deg, #eef5ff 0%, #dce9ff 100%);
	box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 0.95), 0 18rpx 34rpx rgba(87, 124, 182, 0.14);
}

.scene-emoji {
	font-size: 54rpx;
	font-weight: 700;
	color: #2372ff;
	line-height: 1;
}

.scene-caption {
	margin-top: 14rpx;
	font-size: 22rpx;
	color: #6b7280;
}

.error-title {
	display: block;
	font-size: 24rpx;
	font-weight: 600;
	color: #dc2626;
}

.error-text,
.empty-text {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #64748b;
}

@media screen and (max-width: 768px) {
	.plan-card {
		padding: 14rpx;
		border-radius: 22rpx;
	}

	.plan-title {
		font-size: 28rpx;
	}

	.title-accent {
		width: 8rpx;
		height: 46rpx;
	}

	.plan-content {
		min-height: 210rpx;
		margin-top: 14rpx;
		column-gap: 14rpx;
	}

	.stats-row {
		width: 100%;
	}

	.stat-icon-wrap {
		width: 62rpx;
		height: 62rpx;
	}

	.stat-icon {
		font-size: 26rpx;
	}

	.stat-label {
		margin-top: 10rpx;
		font-size: 18rpx;
	}

	.stat-value {
		margin-top: 8rpx;
		font-size: 40rpx;
	}

	.stat-divider {
		height: 92rpx;
		margin-bottom: 6rpx;
	}

	.scene-panel {
		width: 110rpx;
	}

	.scene-circle {
		width: 84rpx;
		height: 84rpx;
	}

	.scene-emoji {
		font-size: 38rpx;
	}

	.scene-caption {
		margin-top: 10rpx;
		font-size: 18rpx;
	}
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
