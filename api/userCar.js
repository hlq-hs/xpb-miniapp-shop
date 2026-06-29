import {
	HEADER,
	TOKENNAME
} from "@/config/app";
import store from "@/store";

const USER_CAR_API_URL = "https://tmxcscadmin.kbiso.com";

function userCarRequest(url, method = "GET", data = {}) {
	const header = {
		...HEADER
	};
	if (store.state.app.token) {
		header[TOKENNAME] = store.state.app.token;
	}
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${USER_CAR_API_URL}${url}`,
			method,
			header,
			data,
			success: (res) => {
				const result = res.data || {};
				if (res.statusCode === 200 && Number(result.code) === 200) {
					resolve(result);
					return;
				}
				reject(result.message || "请求失败");
			},
			fail: () => {
				reject("请求失败");
			}
		});
	});
}

export function getUserCarList(data) {
	return userCarRequest("/api/admin/user/car/list", "GET", data);
}

export function getUserCarInfo(id) {
	return userCarRequest("/api/admin/user/car/info", "GET", { id });
}

export function saveUserCar(data) {
	return userCarRequest("/api/admin/user/car/save", "POST", data);
}

export function updateUserCar(id, data) {
	return userCarRequest(`/api/admin/user/car/update?id=${id}`, "POST", data);
}

export function deleteUserCar(id) {
	return userCarRequest("/api/admin/user/car/delete", "GET", { id });
}

export function setDefaultUserCar(id) {
	return userCarRequest(`/api/admin/user/car/setDefault?id=${encodeURIComponent(id)}`, "POST");
}
