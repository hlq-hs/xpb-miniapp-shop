<template>
	<view class="detail-page">
		<view v-if="loading" class="loading-mask">
			<view class="loading-card">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<view v-if="errorMessage" class="feedback-card error-card">
			<text class="feedback-title">加载失败</text>
			<text class="feedback-text">{{ errorMessage }}</text>
		</view>

		<view v-else-if="hasDetailContent" class="detail-shell">
			<view v-if="projectList.length" class="section-card">
				<view class="section-heading">
					<view class="section-badge">工</view>
					<text class="section-title">项目明细</text>
				</view>
				<view
					v-for="(item, index) in projectList"
					:key="`project-${index}`"
					class="line-card"
				>
					<view class="line-body">
						<view class="line-content">
							<view class="line-header">
								<text class="line-title">{{ getSectionMainValue(item, 'jobName', `项目 ${index + 1}`) }}</text>
							</view>
							<view class="tag-row">
								<view
									v-for="(tag, valueIndex) in createProjectDisplayTags(item)"
									:key="`project-tag-${index}-${valueIndex}`"
									class="soft-tag"
									:class="tag.toneClass"
								>
									<text class="soft-tag-text">{{ tag.text }}</text>
								</view>
							</view>
						</view>
						<view class="metrics-panel">
							<view class="metric-col">
								<text class="metric-label">数量</text>
								<text class="metric-value">{{ getProjectQuantity(item) }}</text>
							</view>
							<view class="metric-col metric-col--amount">
								<text class="metric-label">金额（元）</text>
								<text class="money-value">{{ formatCurrency(getProjectAmount(item)) }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="subtotal-row subtotal-row--project">
					<view class="subtotal-copy">
						<view class="subtotal-icon">工</view>
						<view>
							<text class="subtotal-title">工时小计（共 {{ projectList.length }} 行）</text>
							<text class="subtotal-meta">数量：{{ projectTotalQuantity }}</text>
						</view>
					</view>
					<text class="subtotal-amount">{{ formatCurrency(projectTotalAmount) }}</text>
				</view>
			</view>

			<view v-if="partList.length" class="section-card">
				<view class="section-heading">
					<view class="section-badge">配</view>
					<text class="section-title">配件明细</text>
				</view>
				<view
					v-for="(item, index) in partList"
					:key="`part-${index}`"
					class="line-card"
				>
					<view class="line-body">
						<view class="line-content">
							<view class="line-header">
								<text class="line-title">{{ getSectionMainValue(item, 'partName', `配件 ${index + 1}`) }}</text>
							</view>
							<view class="tag-row">
								<view
									v-for="(tag, valueIndex) in createPartDisplayTags(item)"
									:key="`part-tag-${index}-${valueIndex}`"
									class="soft-tag"
									:class="tag.toneClass"
								>
									<text class="soft-tag-text">{{ tag.text }}</text>
								</view>
							</view>
						</view>
						<view class="metrics-panel">
							<view class="metric-col">
								<text class="metric-label">数量</text>
								<text class="metric-value">{{ getPartQuantity(item) }}</text>
							</view>
							<view class="metric-col metric-col--amount">
								<text class="metric-label">金额（元）</text>
								<text class="money-value">{{ formatCurrency(getPartAmount(item)) }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="subtotal-row">
					<view class="subtotal-copy">
						<view class="subtotal-icon">配</view>
						<view>
							<text class="subtotal-title">配件小计（共 {{ partList.length }} 行）</text>
							<text class="subtotal-meta">数量：{{ partTotalQuantity }}</text>
						</view>
					</view>
					<text class="subtotal-amount">{{ formatCurrency(partTotalAmount) }}</text>
				</view>
			</view>

			<view class="total-card">
				<view>
					<text class="total-title">合计金额</text>
					<text class="total-subtitle">总计 {{ totalLineCount }} 行</text>
				</view>
				<view class="total-value-wrap">
					<text class="total-label">实收金额</text>
					<text class="total-value">{{ formatCurrency(grandTotalAmount) }}</text>
				</view>
			</view>
		</view>

		<view v-else class="feedback-card empty-card">
			<text class="feedback-title">暂无数据</text>
			<text class="feedback-text">当前工单还没有可展示的消费明细</text>
		</view>
	</view>
</template>

<script>
import { getRepairDetailInfo } from '@/api/user.js';

export default {
	data() {
		return {
			jobNo: '',
			shopId: '',
			loading: false,
			errorMessage: '',
			detailData: null
		};
	},
	computed: {
		normalizedDetail() {
			return this.normalizeDetailData(this.detailData);
		},
		settlementTime() {
			const detail = this.normalizedDetail;
			return this.getDisplayValueFromDetail(detail, [
				'finCheckDate',
				'finishDate',
				'settlementTime',
				'checkDate',
				'createTime'
			], '-');
		},
		baseFields() {
			const detail = this.normalizedDetail;
			if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
				return [];
			}
			return Object.keys(detail)
				.filter((key) => key !== 'projectList' && key !== 'partList')
				.map((key) => ({
					key,
					value: this.formatValue(detail[key])
				}));
		},
		projectList() {
			const detail = this.normalizedDetail;
			return this.getSafeList(detail && detail.projectList);
		},
		partList() {
			const detail = this.normalizedDetail;
			return this.getSafeList(detail && detail.partList);
		},
		projectTotalQuantity() {
			return this.projectList.reduce((sum, item) => sum + this.toNumber(this.getProjectQuantity(item)), 0);
		},
		projectTotalAmount() {
			return this.projectList.reduce((sum, item) => sum + this.getProjectAmount(item), 0);
		},
		partTotalQuantity() {
			return this.partList.reduce((sum, item) => sum + this.toNumber(this.getPartQuantity(item)), 0);
		},
		partTotalAmount() {
			return this.partList.reduce((sum, item) => sum + this.getPartAmount(item), 0);
		},
		totalLineCount() {
			return this.projectList.length + this.partList.length;
		},
		grandTotalAmount() {
			return this.projectTotalAmount + this.partTotalAmount;
		},
		hasDetailContent() {
			return this.baseFields.length > 0 || this.projectList.length > 0 || this.partList.length > 0;
		}
	},
	onLoad(options) {
		this.jobNo = String((options && options.jobNo) || '').trim();
		this.shopId = String((options && options.shopId) || '').trim();
		this.fetchDetail();
	},
	methods: {
		async fetchDetail() {
			if (!this.jobNo) {
				this.errorMessage = '缺少 jobNo';
				return;
			}
			if (!this.shopId) {
				this.errorMessage = '缺少 shopId';
				return;
			}
			this.loading = true;
			this.errorMessage = '';
			this.detailData = null;
			try {
				const res = await getRepairDetailInfo(this.jobNo, this.shopId);
				this.detailData = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
			} catch (error) {
				this.detailData = null;
				this.errorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || '请求失败';
			} finally {
				this.loading = false;
			}
		},
		normalizeDetailData(payload) {
			if (Array.isArray(payload)) {
				return payload.length ? payload[0] : null;
			}
			return payload;
		},
		getSafeList(value) {
			return Array.isArray(value) ? value : [];
		},
		createProjectFields(item) {
			return this.createMappedFields(item, [
				{ key: '项目名称', field: 'jobName' },
				{ key: '维修类型', field: 'mType' },
				{ key: '项目工种', field: 'workType' },
				{ key: '工时单价', field: 'jobPrice' },
				{ key: '收费类型', field: 'chargetype' },
				{ key: '项目班组', field: 'workMan' }
			]);
		},
		createProjectInfoFields(item) {
			return this.createMappedFields(item, [
				{ key: '维修类型', field: 'mType' },
				{ key: '项目工种', field: 'workType' },
				{ key: '工时单价', field: 'jobPrice' },
				{ key: '收费类型', field: 'chargetype' },
				{ key: '项目班组', field: 'workMan' }
			]);
		},
		createProjectValueTags(item) {
			return this.createValueTags(item, [
				{ fields: ['jobName', 'job_name'] },
				{ fields: ['mType', 'mtype'] },
				{ fields: ['workType', 'worktype'] },
				{ fields: ['chargetype', 'chargeType'] },
				{ fields: ['workMan', 'workman'] }
			]);
		},
		createProjectDisplayTags(item) {
			const title = this.getSectionMainValue(item, 'jobName', `项目`);
			return this.buildDisplayTags(title, this.createProjectValueTags(item));
		},
		createPartFields(item) {
			return this.createMappedFields(item, [
				{ key: '配件名称', field: 'partName' },
				{ key: '收费类型', field: 'chargeType' },
				{ key: '维修类型', field: 'mType' },
				{ key: '出库数量', field: 'outAmount' },
				{ key: '销售价', field: 'partSaleprc' },
				{ key: '项目工种', field: 'workType' },
				{ key: '项目班组', field: 'workMan' }
			]);
		},
		createPartInfoFields(item) {
			return this.createMappedFields(item, [
				{ key: '配件名称', field: 'partName' },
				{ key: '收费类型', field: 'chargeType' },
				{ key: '维修类型', field: 'mType' },
				{ key: '出库数量', field: 'outAmount' },
				{ key: '销售价', field: 'partSaleprc' },
				{ key: '项目工种', field: 'workType' },
				{ key: '项目班组', field: 'workMan' }
			]);
		},
		createPartValueTags(item) {
			return this.createValueTags(item, [
				{ fields: ['partName', 'part_name'] },
				{ fields: ['chargeType', 'chargetype'] },
				{ fields: ['mType', 'mtype'] },
				{ fields: ['workType', 'worktype'] },
				{ fields: ['workMan', 'workman'] }
			]);
		},
		createPartDisplayTags(item) {
			const title = this.getSectionMainValue(item, 'partName', `配件`);
			return this.buildDisplayTags(title, this.createPartValueTags(item));
		},
		createMappedFields(item, fieldMap) {
			if (!item || typeof item !== 'object' || Array.isArray(item)) {
				return [];
			}
			return fieldMap
				.map((config) => ({
					key: config.key,
					value: this.formatValue(this.getFieldValue(item, config))
				}))
				.filter((field) => field.value !== '-');
		},
		createValueTags(item, fieldMap) {
			if (!item || typeof item !== 'object' || Array.isArray(item)) {
				return [];
			}
			return fieldMap
				.map((config) => {
					const rawValue = this.getFieldValue(item, config);
					if (rawValue === '' || rawValue === null || rawValue === undefined) {
						return '';
					}
					return typeof config.formatter === 'function'
						? config.formatter(rawValue)
						: this.formatValue(rawValue);
				})
				.filter((value) => value && value !== '-');
		},
		buildDisplayTags(title, values) {
			const seen = new Set();
			const normalizedTitle = this.normalizeTagValue(title);
			if (normalizedTitle) {
				seen.add(normalizedTitle);
			}
			return values.filter((value) => {
				const normalizedValue = this.normalizeTagValue(value);
				if (!normalizedValue || seen.has(normalizedValue)) {
					return false;
				}
				seen.add(normalizedValue);
				return true;
			}).map((value, index) => ({
				text: value,
				toneClass: this.getTagToneClassByIndex(index)
			}));
		},
		normalizeTagValue(value) {
			return String(value || '').trim().toLowerCase();
		},
		getTagToneClassByIndex(index) {
			const toneClasses = ['', 'soft-tag--green', 'soft-tag--orange', 'soft-tag--purple'];
			return toneClasses[index % toneClasses.length];
		},
		getFieldValue(item, config) {
			const fields = Array.isArray(config.fields)
				? config.fields
				: [config.field];
			for (let i = 0; i < fields.length; i += 1) {
				const value = this.getFieldValueByCaseInsensitiveKey(item, fields[i]);
				if (value !== '' && value !== null && value !== undefined) {
					return value;
				}
			}
			return '';
		},
		getFieldValueByCaseInsensitiveKey(item, fieldName) {
			if (!fieldName || !item || typeof item !== 'object') {
				return '';
			}
			if (
				Object.prototype.hasOwnProperty.call(item, fieldName)
				&& item[fieldName] !== ''
				&& item[fieldName] !== null
				&& item[fieldName] !== undefined
			) {
				return item[fieldName];
			}
			const normalizedFieldName = this.normalizeFieldKey(fieldName);
			const keys = Object.keys(item);
			for (let i = 0; i < keys.length; i += 1) {
				const currentKey = keys[i];
				if (
					this.normalizeFieldKey(currentKey) === normalizedFieldName
					&& item[currentKey] !== ''
					&& item[currentKey] !== null
					&& item[currentKey] !== undefined
				) {
					return item[currentKey];
				}
			}
			return '';
		},
		normalizeFieldKey(fieldName) {
			return String(fieldName)
				.trim()
				.toLowerCase()
				.replace(/[_-]/g, '');
		},
		getSectionMainValue(item, fieldName, fallback) {
			const value = this.getFieldValueByCaseInsensitiveKey(item, fieldName);
			return this.formatValue(value === '' ? fallback : value);
		},
		getDisplayValueFromDetail(detail, fields, fallback) {
			if (!detail || typeof detail !== 'object') {
				return fallback;
			}
			for (let i = 0; i < fields.length; i += 1) {
				const value = this.getFieldValueByCaseInsensitiveKey(detail, fields[i]);
				if (value !== '' && value !== null && value !== undefined) {
					return this.formatValue(value);
				}
			}
			return fallback;
		},
		toNumber(value, fallback = 0) {
			const numberValue = Number(value);
			return Number.isFinite(numberValue) ? numberValue : fallback;
		},
		getProjectQuantity(item) {
			if (!item || typeof item !== 'object' || Array.isArray(item)) {
				return 0;
			}
			return 1;
		},
		getPartQuantity(item) {
			return this.toNumber(this.getFieldValue(item, {
				fields: ['outAmount', 'qty', 'quantity', 'partQty']
			}), 0);
		},
		getProjectAmount(item) {
			return this.toNumber(this.getFieldValue(item, {
				fields: ['amount', 'jobAmount', 'totalAmount', 'jobPrice']
			}), 0);
		},
		getPartAmount(item) {
			const directAmount = this.getFieldValue(item, {
				fields: ['amount', 'partAmount', 'totalAmount', 'saleAmount']
			});
			if (directAmount !== '' && directAmount !== null && directAmount !== undefined) {
				return this.toNumber(directAmount, 0);
			}
			return this.getPartQuantity(item) * this.toNumber(this.getFieldValue(item, {
				fields: ['partSaleprc', 'salePrice', 'price']
			}), 0);
		},
		formatCurrency(value) {
			const amount = this.toNumber(value, 0);
			const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
			return `¥${formatted}`;
		},
		formatPlainNumber(value) {
			const amount = Number(value);
			if (!Number.isFinite(amount)) {
				return this.formatValue(value);
			}
			return amount.toFixed(2);
		},
		formatValue(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			if (Array.isArray(value) || typeof value === 'object') {
				try {
					return JSON.stringify(value);
				} catch (error) {
					return String(value);
				}
			}
			return String(value);
		},
		formatIndex(index) {
			const value = index + 1;
			return value < 10 ? `0${value}` : String(value);
		}
	}
};
</script>

<style scoped lang="scss">
.detail-page {
	position: relative;
	min-height: 100vh;
	padding: 28rpx 24rpx 40rpx;
	background:
		radial-gradient(circle at top left, rgba(250, 232, 210, 0.78), rgba(250, 232, 210, 0) 34%),
		radial-gradient(circle at top right, rgba(225, 232, 255, 0.92), rgba(225, 232, 255, 0) 32%),
		linear-gradient(180deg, #f8f5ef 0%, #f3f5fa 100%);
	box-sizing: border-box;
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(243, 245, 250, 0.74);
	backdrop-filter: blur(4px);
}

.loading-card {
	width: 180rpx;
	height: 180rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 22rpx 60rpx rgba(15, 23, 42, 0.10);
}

.loading-spinner {
	width: 52rpx;
	height: 52rpx;
	border: 5rpx solid #f6d9b0;
	border-top-color: #c78e42;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #6b7280;
}

.detail-shell {
	display: flex;
	flex-direction: column;
	row-gap: 28rpx;
}

.hero-section {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 20rpx;
}

.hero-copy {
	flex: 1;
	min-width: 0;
	padding-top: 8rpx;
}

.hero-title {
	display: block;
	font-size: 60rpx;
	font-weight: 700;
	line-height: 1.1;
	color: #171717;
}

.hero-accent {
	width: 84rpx;
	height: 8rpx;
	margin: 22rpx 0 24rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #d8a25f 0%, #f4ddb4 100%);
}

.hero-subtitle {
	display: block;
	font-size: 24rpx;
	line-height: 1.5;
	color: #6b7280;
}

.hero-meta-card {
	width: 248rpx;
	flex-shrink: 0;
	padding: 24rpx 22rpx;
	border-radius: 32rpx;
	background:
		linear-gradient(135deg, rgba(37, 40, 48, 0.98), rgba(18, 20, 26, 0.98)),
		repeating-linear-gradient(
			120deg,
			rgba(255, 255, 255, 0.04) 0rpx,
			rgba(255, 255, 255, 0.04) 2rpx,
			transparent 2rpx,
			transparent 16rpx
		);
	box-shadow: 0 26rpx 56rpx rgba(15, 23, 42, 0.18);
	box-sizing: border-box;
}

.meta-row {
	display: flex;
	align-items: center;
	column-gap: 14rpx;
}

.meta-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: #6d4a1d;
	background: linear-gradient(180deg, #f7ebdb 0%, #ead7ba 100%);
}

.meta-content {
	flex: 1;
	min-width: 0;
}

.meta-label {
	display: block;
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.78);
}

.meta-value {
	display: block;
	margin-top: 6rpx;
	font-size: 24rpx;
	font-weight: 600;
	line-height: 1.35;
	color: #ffffff;
	word-break: break-all;
}

.meta-divider {
	height: 1rpx;
	margin: 18rpx 0;
	background: rgba(255, 255, 255, 0.14);
}

.section-card,
.feedback-card {
	padding: 28rpx 30rpx;
	border-radius: 32rpx;
	background: rgba(255, 255, 255, 0.96);
	box-shadow: 0 18rpx 48rpx rgba(15, 23, 42, 0.08);
	box-sizing: border-box;
}

.section-heading {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	column-gap: 16rpx;
	row-gap: 10rpx;
	margin-bottom: 24rpx;
}

.section-badge {
	width: 68rpx;
	height: 68rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
	color: #8b5e2d;
	background: linear-gradient(180deg, #fbf3e8 0%, #f3e1c9 100%);
}

.section-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #111827;
}

.line-card {
	padding: 10rpx 0 28rpx;
	border-radius: 0;
	background: transparent;
	border: 0;
}

.line-card + .line-card {
	margin-top: 22rpx;
	padding-top: 32rpx;
	border-top: 1rpx solid #eceff4;
}

.line-header {
	display: block;
	min-height: 40rpx;
}

.line-title {
	font-size: 28rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #111827;
}

.line-body {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 24rpx;
}

.line-content {
	flex: 1;
	min-width: 0;
	padding-right: 12rpx;
}

.metrics-panel {
	width: 220rpx;
	flex-shrink: 0;
	display: grid;
	grid-template-columns: 64rpx 112rpx;
	column-gap: 28rpx;
	align-items: start;
	padding-top: 2rpx;
}

.metric-label {
	font-size: 20rpx;
	color: #6b7280;
	text-align: center;
	white-space: nowrap;
}

.metric-col {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.metric-col--amount {
	align-items: center;
}

.metric-col--amount .metric-label,
.metric-col--amount .money-value {
	text-align: center;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
	margin: 20rpx 0 0;
}

.soft-tag {
	padding: 10rpx 20rpx;
	border-radius: 18rpx;
	color: #3156b3;
	background: linear-gradient(180deg, #f5f8ff 0%, #e7eeff 100%);
}

.soft-tag-text {
	font-size: 22rpx;
	line-height: 1.2;
	color: inherit;
}

.soft-tag--green {
	color: #237a3b;
	background: linear-gradient(180deg, #f2fbf4 0%, #dff3e4 100%);
}

.soft-tag--orange {
	color: #b45e17;
	background: linear-gradient(180deg, #fff6eb 0%, #fde7ce 100%);
}

.soft-tag--purple {
	color: #7a3fb3;
	background: linear-gradient(180deg, #faf1ff 0%, #eeddfb 100%);
}

.metric-value {
	font-size: 42rpx;
	font-weight: 700;
	line-height: 1;
	color: #111827;
	margin-top: 14rpx;
	text-align: center;
}

.money-value {
	font-size: 42rpx;
	font-weight: 700;
	line-height: 1;
	color: #111827;
	margin-top: 14rpx;
	text-align: center;
}

.subtotal-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 20rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid #eceff4;
}

.subtotal-row--project {
	margin-top: 10rpx;
}

.subtotal-copy {
	display: flex;
	align-items: center;
	column-gap: 18rpx;
}

.subtotal-icon {
	width: 68rpx;
	height: 68rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	font-weight: 700;
	color: #8b5e2d;
	background: linear-gradient(180deg, #fbf3e8 0%, #f3e1c9 100%);
}

.subtotal-title {
	display: block;
	font-size: 26rpx;
	font-weight: 700;
	color: #111827;
}

.subtotal-meta {
	display: block;
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #6b7280;
}

.subtotal-amount {
	font-size: 42rpx;
	font-weight: 700;
	line-height: 1;
	color: #111827;
	width: 112rpx;
	margin-right: 16rpx;
	text-align: center;
}

.total-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 20rpx;
	padding: 28rpx 30rpx;
	border-radius: 26rpx;
	background:
		linear-gradient(135deg, rgba(37, 40, 48, 0.98), rgba(18, 20, 26, 0.98)),
		repeating-linear-gradient(
			120deg,
			rgba(255, 255, 255, 0.04) 0rpx,
			rgba(255, 255, 255, 0.04) 2rpx,
			transparent 2rpx,
			transparent 16rpx
		);
	box-shadow: 0 26rpx 56rpx rgba(15, 23, 42, 0.18);
}

.total-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #ffffff;
}

.total-subtitle {
	display: block;
	margin-top: 20rpx;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.84);
}

.total-value-wrap {
	text-align: right;
}

.total-label {
	display: block;
	font-size: 24rpx;
	color: #edd3a6;
}

.total-value {
	display: block;
	margin-top: 10rpx;
	font-size: 64rpx;
	font-weight: 700;
	line-height: 1;
	color: #f3cf93;
}

.feedback-title {
	display: block;
	font-size: 34rpx;
	font-weight: 600;
	color: #111827;
}

.feedback-text {
	display: block;
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.5;
	color: #6b7280;
}

.error-card .feedback-title {
	color: #b42318;
}

.empty-card {
	text-align: center;
}

@media screen and (min-width: 720rpx) {
	.hero-meta-card {
		width: 320rpx;
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
