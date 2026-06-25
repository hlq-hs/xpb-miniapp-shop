// +----------------------------------------------------------------------
// | CRMEB [ CRMEB璧嬭兘寮€鍙戣€咃紝鍔╁姏浼佷笟鍙戝睍 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2025 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB骞朵笉鏄嚜鐢辫蒋浠讹紝鏈粡璁稿彲涓嶈兘鍘绘帀CRMEB鐩稿叧鐗堟潈
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import store from '../store';
import { checkLogin } from './login';
import { login } from '../api/public';
import Cache from '../utils/cache';
import { STATE_R_KEY, USER_INFO } from './../config/cache';

class Routine {

	constructor() {
		this.scopeUserInfo = 'scope.userInfo';
	}

	async getUserCode() {
		let isAuth = await this.isAuth(), code = '';
		if (isAuth) code = await this.getCode();
		return code;
	}

	/**
	 * 灏忕▼搴忓熀纭€搴撶増鏈彿姣旇緝
	 */
	compareVersion(v1, v2) {
		v1 = v1.split('.');
		v2 = v2.split('.');
		const len = Math.max(v1.length, v2.length);

		while (v1.length < len) {
			v1.push('0');
		}
		while (v2.length < len) {
			v2.push('0');
		}

		for (let i = 0; i < len; i++) {
			const num1 = parseInt(v1[i]);
			const num2 = parseInt(v2[i]);

			if (num1 > num2) {
				return 1;
			} else if (num1 < num2) {
				return -1;
			}
		}

		return 0;
	}

	/**
	 * 鑾峰彇鐢ㄦ埛淇℃伅
	 */
	getUserProfile() {
		return new Promise(async (resolve, reject) => {
			let code = '';
			try {
				code = await this.getUserCode();
			} catch (e) {
				code = '';
			}
			uni.getUserProfile({
				lang: 'zh_CN',
				desc: '鐢ㄤ簬瀹屽杽浼氬憳璧勬枡',
				success(user) {
					if (code) user.code = code;
					resolve({ userInfo: user, islogin: false });
				},
				fail(res) {
					reject(res);
				}
			});
		});
	}

	/**
	 * 鑾峰彇鐢ㄦ埛淇℃伅
	 */
	authorize() {
		let that = this;
		return new Promise((resolve, reject) => {
			if (checkLogin())
				return resolve({
					userInfo: Cache.get(USER_INFO, true),
					islogin: true,
				});
			uni.authorize({
				scope: that.scopeUserInfo,
				success() {
					resolve({ islogin: false });
				},
				fail(res) {
					reject(res);
				}
			});
		});
	}

	async getCode() {
		let provider = await this.getProvider();
		if (Array.isArray(provider)) {
			provider = provider[0];
		}
		return new Promise((resolve, reject) => {
			uni.login({
				provider: provider,
				success(res) {
					if (res.code) Cache.set(STATE_R_KEY, res.code, 10800);
					return resolve(res.code);
				},
				fail() {
					return reject(null);
				}
			});
		});
	}

	/**
	 * 鑾峰彇鏈嶅姟渚涘簲鍟?
	 */
	getProvider() {
		return new Promise((resolve) => {
			uni.getProvider({
				service: 'oauth',
				success(res) {
					resolve(res.provider);
				},
				fail() {
					resolve(false);
				}
			});
		});
	}

	/**
	 * 鏄惁鎺堟潈
	 */
	isAuth() {
		let that = this;
		return new Promise((resolve) => {
			uni.getSetting({
				success(res) {
					if (!res.authSetting[that.scopeUserInfo]) {
						resolve(true);
					} else {
						resolve(true);
					}
				},
				fail() {
					resolve(false);
				}
			});
		});
	}

	/**
	 * 灏忕▼搴忕櫥褰?
	 */
	authUserInfo(code, data) {
		return new Promise((resolve, reject) => {
			login(code, data).then(res => {
				if (res.data.type === 'login') {
					store.commit('LOGIN', {
						token: res.data.token
					});
					store.commit("SETUID", res.data.uid);
				}
				return resolve(res);
			}).catch(res => {
				if (this.isInvalidCodeError(res)) {
					return this.retryAuthUserInfo(data).then(resolve).catch(reject);
				}
				return reject(res);
			});
		});
	}

	isInvalidCodeError(error) {
		const message = typeof error === 'string'
			? error
			: [
				error && error.message,
				error && error.msg,
				error && error.errMsg,
				error && error.data && error.data.message
			].filter(Boolean).join(' ');
		return /40029|invalid code/i.test(message);
	}

	retryAuthUserInfo(data) {
		const nextData = data && typeof data === 'object' ? {
			...data
		} : data;
		if (nextData && nextData.__codeRetry) {
			return Promise.reject('微信登录凭证失效，请重试');
		}
		if (nextData && typeof nextData === 'object') {
			nextData.__codeRetry = true;
		}
		return this.getCode().then((newCode) => {
			if (nextData && typeof nextData === 'object') {
				nextData.code = newCode;
			}
			return login(newCode, nextData).then(res => {
				if (res.data.type === 'login') {
					store.commit('LOGIN', {
						token: res.data.token
					});
					store.commit("SETUID", res.data.uid);
				}
				return res;
			});
		});
	}
}

export default new Routine();
