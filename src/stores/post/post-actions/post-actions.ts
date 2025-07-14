import { rust } from '@shared/api/api';
import { getDeletePostNotifyData, getDeletePostSuccessNotifyData } from '@shared/config/notify-data';
import { VirtualList } from '@shared/config/types';
import { numericId } from '@shared/lib/numbers';
import { generateSimpleUUID } from '@shared/lib/string';
import { fileActionsStore } from '@stores/file';
import { notifyInteractionsStore } from '@stores/notify/notify-interactions/notify-interactions';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { MobxSaiFetchOptions, MobxSaiInstance, mobxSaiHandler, mobxState, useMobxUpdate } from 'mobx-toolbox';
import { postInteractionsStore } from '../post-interactions/post-interactions';
import { postServiceStore } from '../post-service/post-service';
import { CreatePostBody, GetPostFeedResponse, GetPostsParams, GetUserPostsParams } from './types';

const fetchCache = new Map<string, MobxSaiInstance<any>>();

const defaultOptions: MobxSaiFetchOptions = {
	id: "default",
	page: null,
	pageSetterName: null,
	isFetchUp: false,
	fetchType: "default",
	fetchIfPending: false,
	fetchIfHaveData: true,
	isSetData: true,
	needPending: true,
	cacheSystem: {
		limit: null,
		setCache: () => { }
	},
	dataScope: {
		class: null,
		startFrom: 'top',
		topPercentage: null,
		botPercentage: null,
		resetPage: false,
		relativeParamsKey: null,
		setParams: null,
		upOrDownParamsKey: null,
		isHaveMoreResKey: null,
		howMuchGettedToTop: 2,
		pageParamsKey: null
	},
	fetchAddTo: {
		path: '',
		addTo: 'reset',
		isSetReversedArr: false,
		isSetPrevArr: false,
		setArrCallback: null
	},
};

class MobxSaiFetch<T> {
	constructor(options?: Partial<MobxSaiFetchOptions>) {
		this.options = {
			...this.options,
			...defaultOptions,
			...options,
			cacheSystem: {
				...this.options.cacheSystem,
				...defaultOptions.cacheSystem,
				...options!.cacheSystem
			},
			dataScope: {
				...this.options.dataScope,
				...defaultOptions.dataScope,
				...options!.dataScope
			},
			fetchAddTo: {
				...this.options.fetchAddTo,
				...defaultOptions.fetchAddTo,
				...options!.fetchAddTo
			}
		};
		makeAutoObservable(this, {}, { autoBind: true });
		this.setupScrollTracking();

		if (!this.options.needPending) {
			this.status = "fulfilled";
		}
	}

	isPending = false;
	isFulfilled = false;
	isRejected = false;

	status: "pending" | "fulfilled" | "rejected" = "pending";
	data: T | null = null;
	error: Error | null = null;

	addedToEndCount = 0;
	addedToStartCount = 0;
	fetchedCount = 0;

	scrollProgress = 0;
	gettedToTop = mobxState(0)('gettedToTop');
	botStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	topStatus: "pending" | "fulfilled" | "rejected" | "" = "";
	scrollCachedData = mobxState([])('scrollCachedData');

	isBotPending = false;
	isBotRejected = false;
	isBotFulfulled = false;

	isTopPending = false;
	isTopRejected = false;
	isTopFulfulled = false;

	topError: Error | null = null;
	botError: Error | null = null;

	isHaveMoreBot = mobxState(true)('isHaveMoreBot');
	isHaveMoreTop = mobxState(true)('isHaveMoreTop');

	private oldOptions: MobxSaiFetchOptions | null = null;

	promiseOrFunction: (() => Promise<T>) | null = null;
	setPromiseOrFunction = (promise: (() => Promise<T>) | null) => this.promiseOrFunction = promise;

	options: MobxSaiFetchOptions = defaultOptions;

	setupScrollTracking() {
		if (!this.options.dataScope?.class && !this.options.dataScope?.scrollRef) return;

		if (this.options.dataScope?.class && typeof document !== 'undefined') {
			const element = document.querySelector(`.${this.options.dataScope.class}`);
			if (!element) {
				console.warn("Scroll tracking element not found.");
				return;
			}

			const updateScrollProgress = () => {
				const { scrollTop, scrollHeight, clientHeight } = element;
				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			element.addEventListener("scroll", updateScrollProgress);
		}

		// React Native
		else if (this.options.dataScope?.scrollRef) {
			const handleScroll = (event: any) => {
				const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
				const scrollTop = contentOffset.y;
				const scrollHeight = contentSize.height;
				const clientHeight = layoutMeasurement.height;

				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			this.options.dataScope.onScroll = handleScroll;
		}
	}

	handleScrollUpdate(scrollTop: number, scrollHeight: number, clientHeight: number) {
		const { topPercentage, botPercentage, startFrom } = this.options.dataScope!;
		const {
			gettedToTop: { gettedToTop, setGettedToTop },
			isHaveMoreBot: { isHaveMoreBot, setIsHaveMoreBot },
			isHaveMoreTop: { isHaveMoreTop, setIsHaveMoreTop },
			options: { dataScope: {
				relativeParamsKey,
				upOrDownParamsKey,
				howMuchGettedToTop,
				pageParamsKey
			} },
			isTopPending,
			isBotPending,
		} = this;

		this.scrollProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

		// === FETCH TOP ===
		if (
			topPercentage !== null &&
			this.scrollProgress <= topPercentage! &&
			!isTopPending &&
			isHaveMoreTop
		) {
			if (startFrom == 'top' && gettedToTop >= -(howMuchGettedToTop! - 1)) return;

			console.log("FETCH TOP");
			setGettedToTop(p => {
				if ((p + 1) >= howMuchGettedToTop! + 1) setIsHaveMoreBot(true);
				return p + 1;
			});
			this.setTopPending();

			// @ts-ignore
			if (!this?.data?.[this?.options?.fetchAddTo?.path]?.[0]?.id) {
				console.warn(`We can't find your relative Id`);
				return;
			}

			this.oldOptions = this.options;
			this.options = {
				...this.options,
				isSetData: true,
				fetchAddTo: {
					...this.options.fetchAddTo,
					addTo: 'start'
				}
			};

			this.options.dataScope.setParams((prev: any) => {
				const newParams = prev;
				// @ts-ignore
				if (relativeParamsKey) newParams[relativeParamsKey] = this.data[this.options.fetchAddTo.path][0].id;
				if (upOrDownParamsKey) newParams[upOrDownParamsKey] = true;
				if (pageParamsKey) newParams[pageParamsKey] = newParams[pageParamsKey] + 1;
				return newParams;
			});

			if (this.promiseOrFunction) this.fetch(this.promiseOrFunction, 'fromScroll', 'top');
		}

		// === FETCH BOT ===
		if (
			botPercentage !== null &&
			this.scrollProgress >= botPercentage! &&
			!isBotPending &&
			this.data &&
			this.options.fetchAddTo.path &&
			// @ts-ignore
			this.data[this.options.fetchAddTo.path] &&
			this.options.dataScope.setParams &&
			isHaveMoreBot
		) {
			if (startFrom == 'bot' && gettedToTop <= howMuchGettedToTop!) return;

			console.log("FETCH BOT");
			setGettedToTop(p => {
				if ((p - 1) <= howMuchGettedToTop! - 1) setIsHaveMoreTop(true);
				return p - 1;
			});
			this.setBotPending();

			// @ts-ignore
			if (!this.data[this.options.fetchAddTo.path][this.data[this.options.fetchAddTo.path]?.length - 1]?.id) {
				console.warn(`We can't find your relative Id`);
				return;
			}

			this.oldOptions = this.options;
			this.options = {
				...this.options,
				isSetData: true,
				fetchAddTo: {
					...this.options.fetchAddTo,
					addTo: 'end'
				}
			};

			this.options.dataScope.setParams((prev: any) => {
				const newParams = prev;
				// @ts-ignore
				if (relativeParamsKey) newParams[relativeParamsKey] = this.data[this.options.fetchAddTo.path][this.data[this.options.fetchAddTo.path]?.length - 1].id;
				if (upOrDownParamsKey) newParams[upOrDownParamsKey] = false;
				if (pageParamsKey) newParams[pageParamsKey] = newParams[pageParamsKey] + 1;
				return newParams;
			});

			if (this.promiseOrFunction) this.fetch(this.promiseOrFunction, 'fromScroll', 'bot');
		}
	}

	fetch = (promiseOrFunction: Promise<T> | (() => Promise<T>), fromWhere: 'fromScroll' | null, fetchWhat: 'top' | 'bot' | null = null): this => {
		const {
			gettedToTop: { gettedToTop },
			isHaveMoreBot: { setIsHaveMoreBot, isHaveMoreBot },
			isHaveMoreTop: { setIsHaveMoreTop, isHaveMoreTop }
		} = this;
		const {
			dataScope: { startFrom, isHaveMoreResKey, howMuchGettedToTop },
			fetchIfPending,
			fetchIfHaveData,
			fetchAddTo,
			needPending
		} = this.options;

		if (!fetchIfPending && this.isPending) {
			console.warn("Fetch is already pending and fetchIfPending is false.");
			return this;
		}

		if (!fetchIfHaveData && this.data && !fromWhere) {
			console.warn("Data already exists and fetchIfHaveData is false.");
			return this;
		}

		if (fetchWhat === 'bot' && !isHaveMoreBot) {
			console.warn("Skipping BOT fetch because isHaveMoreBot is false");
			return this;
		}

		if (fetchWhat === 'top' && !isHaveMoreTop) {
			console.warn("Skipping TOP fetch because isHaveMoreTop is false");
			return this;
		}

		if (fromWhere == null && fetchWhat == null) {
			if (needPending) {
				this.setPending();
				this.status = "pending";
			}
			this.error = null;
		}

		const fetchPromise =
			promiseOrFunction instanceof Promise
				? () => promiseOrFunction
				: promiseOrFunction;

		if (this.options.dataScope.resetPage && typeof this.options.dataScope.pageParamsKey == 'string') {
			this.options.dataScope.setParams((prev: any) => {
				return {
					...prev,
					[this.options.dataScope.pageParamsKey as string]: 1
				};
			});
		}

		fetchPromise()
			.then((result) => {
				if (fromWhere == null && fetchWhat == null) {
					this.status = "fulfilled";
					this.setFulfilled();
					if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
						setIsHaveMoreBot(result[isHaveMoreResKey as keyof typeof result] as boolean);
					}
				} else {
					if (fetchWhat == 'bot') {
						this.setBotFulfilled();
						if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
							setIsHaveMoreBot(result[isHaveMoreResKey as keyof typeof result] as boolean);
						} else console.warn(`BOT FETCH: Can't find isHaveMore from passed isHaveMoreResKey 'result[isHaveMoreResKey]'`);
					}
					if (fetchWhat == 'top') {
						this.setTopFulfilled();
						if (isHaveMoreResKey && typeof result === 'object' && result !== null && isHaveMoreResKey in result) {
							setIsHaveMoreTop(result[isHaveMoreResKey as keyof typeof result] as boolean);
						} else console.warn(`TOP FETCH: Can't find isHaveMore from passed isHaveMoreResKey 'result[isHaveMoreResKey]'`);
					}
				}

				if (fetchAddTo && fetchAddTo.path && typeof this.data === "object" && this.data !== null) {
					// @ts-ignore
					if (Array.isArray(this.getPathValue(this.data, fetchAddTo.path)) && Array.isArray(result[fetchAddTo.path])) {

						// SCROLL CACHE SYSTEM 
						if (gettedToTop <= -howMuchGettedToTop! && startFrom == 'top') {
							setIsHaveMoreTop(true);
							if (fetchWhat == 'bot') {
								// @ts-ignore
								this.data[fetchAddTo.path].splice(0, this.options.cacheSystem.limit);
							} else {
								// @ts-ignore
								this.data[fetchAddTo.path] = [...this.data[fetchAddTo.path].slice(0, -this.options.cacheSystem.limit)];
							}
						}
						if (fetchWhat == 'bot' && startFrom == 'top') {
							if (gettedToTop === -howMuchGettedToTop!) {
								// @ts-ignore
								const cachedList = this.data[fetchAddTo.path].slice(0, this.options.cacheSystem.limit);
								this.scrollCachedData.setScrollCachedData(cachedList);
							}
						}
						if (fetchWhat == 'top' && startFrom == 'bot') {
							if (gettedToTop === howMuchGettedToTop) {
								// @ts-ignore
								const cachedList = this.data[fetchAddTo.path].slice(-this.options.cacheSystem.limit);
								this.scrollCachedData.setScrollCachedData(cachedList);
							}
						}

						const targetArray = this.getPathValue(this.data, fetchAddTo.path);

						switch (fetchAddTo.addTo) {
							case "start":
								this.setAddedToStartCount('+');
								if (fetchAddTo.setArrCallback) {
									fetchAddTo.setArrCallback(prev => {
										// @ts-ignore
										return fetchAddTo?.isSetReversedArr ? [...result[fetchAddTo.path], ...prev].reverse() : [...result[fetchAddTo.path].reverse(), ...prev];
									});
								}
								if (!this.options?.isSetData) return;
								// @ts-ignore
								this.setPathValue(this.data, fetchAddTo.path, [...result[fetchAddTo.path], ...targetArray]);
								break;
							case "end":
								this.setAddedToEndCount('+');
								if (fetchAddTo.setArrCallback) {
									fetchAddTo.setArrCallback(prev => {
										// @ts-ignore
										return fetchAddTo?.isSetReversedArr ? [...prev, ...result[fetchAddTo.path]].reverse() : [...prev, ...result[fetchAddTo.path]];
									});
								}
								if (!this.options?.isSetData) return;
								// @ts-ignore
								this.setPathValue(this.data, fetchAddTo.path, [...targetArray, ...result[fetchAddTo.path]]);
								break;
							case "reset":
							default:
								if (fetchAddTo.setArrCallback) {
									if (fetchAddTo.path) {
										// @ts-ignore
										fetchAddTo.setArrCallback(fetchAddTo?.isSetReversedArr ? [...result[fetchAddTo.path]]?.reverse() : result[fetchAddTo.path]);
									} else {
										fetchAddTo.setArrCallback(result as []);
									}
								}
								if (!this.options?.isSetData) return;
								this.setPathValue(this.data, fetchAddTo.path, result);
						}
					} else {
						this.setFetchedCount('+');
						if (fetchAddTo.setArrCallback) {
							if (fetchAddTo?.path) {
								fetchAddTo.setArrCallback(prev => {
									if (fetchAddTo?.isSetPrevArr) {
										if (fetchAddTo?.isSetReversedArr) {
											// @ts-ignore
											return fetchAddTo?.addTo == 'start' ? [...prev, ...[...result[fetchAddTo.path]]?.reverse()] : [...[...result[fetchAddTo.path]]?.reverse(), ...prev];
										}
										// @ts-ignore
										return fetchAddTo?.addTo == 'start' ? [...prev, ...result[fetchAddTo.path]] : [...result[fetchAddTo.path], ...prev];
									}
									if (fetchAddTo?.isSetReversedArr) {
										// @ts-ignore
										return result[fetchAddTo.path]?.reverse();
									}
									// @ts-ignore
									return result[fetchAddTo.path];
								});
							} else {
								fetchAddTo.setArrCallback(result as []);
							}
						}
						if (!this.options?.isSetData) return;
						this.data = result;
					}
				} else {
					this.setFetchedCount('+');
					if (fetchAddTo.setArrCallback) {
						if (fetchAddTo?.path) {
							fetchAddTo.setArrCallback(prev => {
								if (fetchAddTo?.isSetPrevArr) {
									// @ts-ignore
									const arrCount = [...prev, ...[...result[fetchAddTo.path]]].length;
									if (fetchAddTo?.isSetReversedArr) {
										// @ts-ignore
										const newList = fetchAddTo?.addTo == 'start' ? [...prev, ...[...result[fetchAddTo.path]]?.reverse()] : [...[...result[fetchAddTo.path]]?.reverse(), ...prev];
										if (this.options.cacheSystem.limit) {
											if (arrCount >= this.options.cacheSystem.limit && this.options.cacheSystem?.setCache) {
												// @ts-ignore
												this.options.cacheSystem.setCache(newList);
											}
										}
										return newList;
									}
									// @ts-ignore
									const newList = fetchAddTo?.addTo == 'start' ? [...prev, ...result[fetchAddTo.path]] : [...result[fetchAddTo.path], ...prev];
									if (this.options.cacheSystem.limit) {
										if (arrCount >= this.options.cacheSystem.limit && this.options.cacheSystem?.setCache) {
											// @ts-ignore
											this.options.cacheSystem.setCache(newList);
										}
									}
									return newList;
								}
								// @ts-ignore
								const newList = result[fetchAddTo.path];
								const arrCount = newList?.length;
								if (this.options.cacheSystem.limit) {
									if (arrCount >= this.options.cacheSystem.limit && this.options.cacheSystem?.setCache) {
										// @ts-ignore
										this.options.cacheSystem.setCache(fetchAddTo?.isSetReversedArr ? newList?.reverse() : newList);
									}
								}
								if (fetchAddTo?.isSetReversedArr) {
									return newList?.reverse();
								}
								return newList;
							});
						} else {
							fetchAddTo.setArrCallback(result as []);
						}
					}
					if (!this.options?.isSetData) return;
					this.data = result;
				}

				if (this.options.page && this.options.pageSetterName && !this.options.isFetchUp) {
					(this.options.page as any)[this.options.pageSetterName]((p: number) => p + 1);
				}
			})
			.catch((err) => {
				if (fromWhere == null && fetchWhat == null) {
					this.status = "rejected";
					this.setRejected();
					this.error = err;
				} else {
					if (fetchWhat == 'bot') this.setBotRejected(err);
					if (fetchWhat == 'top') this.setTopRejected(err);
				}
			})
			.finally(() => {
				if (this.oldOptions) {
					this.options = this.oldOptions;
				}
			});

		return this;
	};

	isFetched = () => {
		return !!this.data;
	};

	private setAddedToEndCount = (which: '+' | '-' | number) => {
		this.setFetchedCount('+');
		if (typeof which == 'number') this.addedToEndCount = which;
		if (which == '+') this.addedToEndCount = this.addedToEndCount + 1;
		else this.addedToEndCount = this.addedToEndCount - 1;
	};

	private setAddedToStartCount = (which: '+' | '-' | number) => {
		this.setFetchedCount('+');
		if (typeof which == 'number') this.addedToStartCount = which;
		if (which == '+') this.addedToStartCount = this.addedToStartCount + 1;
		else this.addedToStartCount = this.addedToStartCount - 1;
	};

	private setFetchedCount = (which: '+' | '-' | number) => {
		if (typeof which == 'number') this.fetchedCount = which;
		if (which == '+') this.fetchedCount = this.fetchedCount + 1;
		else this.fetchedCount = this.fetchedCount - 1;
	};

	private getPathValue = (obj: any, path: string): any => {
		return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
	};

	private setPathValue = (obj: any, path: string, value: any) => {
		const keys = path.split(".");
		let temp = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			if (!temp[keys[i]]) temp[keys[i]] = {};
			temp = temp[keys[i]];
		}
		temp[keys[keys.length - 1]] = value;
	};

	private setFulfilled = () => {
		this.isFulfilled = true;
		this.isPending = false;
		this.isRejected = false;
	};

	private setRejected = () => {
		this.isRejected = true;
		this.isFulfilled = false;
		this.isPending = false;
	};

	private setPending = () => {
		this.isFulfilled = false;
		this.isPending = true;
		this.isRejected = false;
	};

	private setTopPending = () => {
		this.topStatus = 'pending';
		this.isTopPending = true;
		this.isTopRejected = false;
		this.isTopFulfulled = false;
	};

	private setTopRejected = (err: Error) => {
		this.topError = err;
		this.topStatus = 'rejected';
		this.isTopPending = false;
		this.isTopRejected = true;
		this.isTopFulfulled = false;
	};

	private setTopFulfilled = () => {
		this.topStatus = 'fulfilled';
		this.isTopPending = false;
		this.isTopRejected = false;
		this.isTopFulfulled = true;
	};

	private setBotPending = () => {
		this.botStatus = 'pending';
		this.isBotPending = true;
		this.isBotRejected = false;
		this.isBotFulfulled = false;
	};

	private setBotRejected = (err: Error) => {
		this.botError = err;
		this.botStatus = 'rejected';
		this.isBotPending = false;
		this.isBotRejected = true;
		this.isBotFulfulled = false;
	};

	private setBotFulfilled = () => {
		this.botStatus = 'fulfilled';
		this.isBotPending = false;
		this.isBotRejected = false;
		this.isBotFulfulled = true;
	};

	setScrollRef(scrollRef: any) {
		if (this.options.dataScope) {
			this.options.dataScope.scrollRef = scrollRef;

			const handleScroll = (event: any) => {
				const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
				const scrollTop = contentOffset.y;
				const scrollHeight = contentSize.height;
				const clientHeight = layoutMeasurement.height;

				this.handleScrollUpdate(scrollTop, scrollHeight, clientHeight);
			};

			this.options.dataScope.onScroll = handleScroll;
		}

		return this;
	}

	reset = (): this => {
		this.isPending = false;
		this.isFulfilled = false;
		this.isRejected = false;
		this.status = "pending";
		this.data = null;
		this.error = null;

		this.addedToEndCount = 0;
		this.addedToStartCount = 0;
		this.fetchedCount = 0;

		this.scrollProgress = 0;
		this.gettedToTop.setGettedToTop(0);
		this.scrollCachedData.setScrollCachedData([]);

		this.botStatus = "";
		this.topStatus = "";

		this.isBotPending = false;
		this.isBotRejected = false;
		this.isBotFulfulled = false;

		this.isTopPending = false;
		this.isTopRejected = false;
		this.isTopFulfulled = false;

		this.topError = null;
		this.botError = null;

		this.isHaveMoreBot.setIsHaveMoreBot(true);
		this.isHaveMoreTop.setIsHaveMoreTop(true);

		this.oldOptions = null;

		return this;
	};
}

export function mobxSaiFetch<T>(
	promiseOrFunction: Promise<T> | (() => Promise<T>),
	options: Partial<MobxSaiFetchOptions> = {}
): MobxSaiInstance<T> {
	const { id, fetchIfPending = false, fetchIfHaveData = true } = options;

	if (id && fetchCache.has(id)) {
		const instance = fetchCache.get(id) as MobxSaiInstance<T>;
		const { isPending, data } = instance;

		instance.options = {
			...instance.options,
			...defaultOptions,
			...options,
			cacheSystem: {
				...instance.options!.cacheSystem,
				...defaultOptions.cacheSystem,
				...options.cacheSystem
			},
			dataScope: {
				...instance.options!.dataScope,
				...defaultOptions.dataScope,
				...options.dataScope
			},
			fetchAddTo: {
				...instance.options!.fetchAddTo,
				...defaultOptions.fetchAddTo,
				...options.fetchAddTo
			}
		};

		if (!fetchIfPending && isPending) {
			console.warn("Fetch is already pending and fetchIfPending is false.");
			return instance;
		}
		if (!fetchIfHaveData && data) {
			console.warn("Data already exists and fetchIfHaveData is false.");
			return instance;
		}
		if (options.page && options.pageSetterName && options.isFetchUp) {
			(options.page as any)[options.pageSetterName]((p: number) => p - 1);
		}
		if (instance.fetch) {
			var cachedArr: string | any[] = [];
			if (options.cacheSystem?.setCache && !instance.data && options.cacheSystem?.limit) {
				options.cacheSystem.setCache(prev => {
					if (prev?.length == 0 || (prev?.length < options.cacheSystem!.limit!)) {
						return prev;
					}
					cachedArr = prev;
					return prev;
				});
				if (cachedArr?.length != 0) {
					// @ts-ignore
					const instanceWithCache = { ...instance, data: { ...instance?.data, [options.fetchAddTo.path]: cachedArr } };
					// @ts-ignore
					return instanceWithCache;
				}
			}
			// @ts-ignore
			instance.setPromiseOrFunction(promiseOrFunction);
			instance.fetch(promiseOrFunction);
		}
		else throw new Error("Fetch method is not defined on the instance.");
		return instance;
	}

	const instance = (new MobxSaiFetch<T>(options)) as MobxSaiInstance<T>;

	if (promiseOrFunction instanceof Promise) {
		// @ts-ignore
		instance.setPromiseOrFunction(promiseOrFunction);
		if (instance.fetch) instance.fetch(() => promiseOrFunction);
		else throw new Error("Fetch method is not defined on the instance.");
	} else if (typeof promiseOrFunction === "function") {
		// @ts-ignore
		instance.setPromiseOrFunction(promiseOrFunction);
		if (instance.fetch) instance.fetch(promiseOrFunction);
		else throw new Error("Fetch method is not defined on the instance.");
	} else throw new Error("Invalid argument passed to mobxSaiFetch.");

	if (id) fetchCache.set(id, instance);
	return instance;
}

class PostActionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	// GET FEED

	postsFeed: MobxSaiInstance<VirtualList<GetPostFeedResponse[]>> = {};
	POSTS_LIMIT = 20;

	getPostsAction = async (fetchIfHaveData = true, needAddToArr = true, newFeed = false, needPending = true) => {
		const { getPostsSuccessHandler, getPostsErrorHandler } = postServiceStore;
		const { postScrollRef: { postScrollRef } } = postInteractionsStore;

		if (!postScrollRef) {
			console.warn("[getPostsAction] postScrollRef is not loaded yet");
			return;
		}

		const params = mobxState<GetPostsParams>({
			relativeId: null,
			limit: 20,
			page: 1,
			newFeed,
			up: false
		})("params");

		//  botPercentage !== null &&
		// 	this.scrollProgress >= botPercentage! &&
		// 	!isBotPending &&
		// 	this.data &&
		// 	this.options.fetchAddTo.path &&
		// 	// @ts-ignore
		// 	this.data[this.options.fetchAddTo.path] &&
		// 	this.options.dataScope.setParams &&
		// 	isHaveMoreBot

		this.postsFeed = mobxSaiFetch(
			() => getPosts(params.params),
			{
				id: "getPostsAction",
				fetchIfHaveData,
				needPending,
				dataScope: {
					startFrom: "top",
					scrollRef: postScrollRef,
					botPercentage: 80,
					setParams: params.setParams,
					resetPage: newFeed ? true : false,
					pageParamsKey: "page",
					isHaveMoreResKey: "isHaveMore",
					upOrDownParamsKey: "up",
					howMuchGettedToTop: 10000
				},
				cacheSystem: {
					limit: this.POSTS_LIMIT
				},
				fetchAddTo: fetchIfHaveData ? {} : {
					path: "list",
					addTo: needAddToArr ? "end" : undefined
				}
			}
		);

		mobxSaiHandler(
			this.postsFeed,
			getPostsSuccessHandler,
			getPostsErrorHandler
		);
	};

	// GET GRID USER POSTS

	userPosts: MobxSaiInstance<VirtualList<GetPostFeedResponse[]>> = {};
	USER_POSTS_LIMIT = 21;

	getUserPostsAction = async (tag: string, needPending: boolean = true, fetchIfHaveData = false, onFinish = () => { }) => {
		const {
			userPostsScrollRef: { userPostsScrollRef },
			setPostUpdater
		} = postInteractionsStore;

		if (!tag) {
			console.log("[getUserPostsAction]: tag is undefined");
			return true;
		}

		try {
			const params = mobxState({
				relativeId: null,
				limit: this.USER_POSTS_LIMIT,
				up: false
			})("params");

			this.userPosts = mobxSaiFetch(
				() => getUserPosts(tag, params.params),
				{
					id: tag,
					fetchIfHaveData,
					needPending,
					dataScope: {
						setParams: params.setParams,
						botPercentage: 80,
						startFrom: "top",
						scrollRef: userPostsScrollRef,
						relativeParamsKey: "relativeId",
						upOrDownParamsKey: "up"
					},
					cacheSystem: {
						limit: this.USER_POSTS_LIMIT,
					},
					fetchAddTo: fetchIfHaveData ?
						{} : {
							path: "list",
							addTo: "end",
						}
				}
			);

			const disposer = reaction(
				() => this.userPosts?.data,
				(data) => {
					if (!data) return true;
					setPostUpdater(useMobxUpdate(() => data?.list));
					onFinish();
					disposer();
				}
			);
		} catch (error) {
			console.log("Error fetching user posts:", error);
			return true;
		}
		return true;
	};

	// LIKE/UNLIKE POST

	likePost: MobxSaiInstance<void> = {};

	likePostAction = async (postId: number, post: GetPostFeedResponse) => {
		const { postUpdater } = postInteractionsStore;

		this.likePost = mobxSaiFetch(
			() => likePost(postId),
			{ id: postId.toString(), }
		);

		mobxSaiHandler(
			this.likePost,
			() => { },
			(err) => {
				console.log("Error liking post", err);
				if (!postUpdater) return;
				runInAction(() => {
					postUpdater(postId, "likesCount", (prev: number) => prev - (post?.isLiked ? 1 : -1));
					postUpdater(postId, "isLiked", (prev: boolean) => !prev);
				});
			}
		);
	};

	// FAVORITE/UNFAVORITE POST

	favPost: MobxSaiInstance<void> = {};

	favPostAction = async (postId: number, post: GetPostFeedResponse) => {
		const { postUpdater } = postInteractionsStore;
		try {
			this.favPost = mobxSaiFetch(favPost(postId));
		} catch (error) {
			console.log("Error favoriting post", error);
			if (!postUpdater) return;
			runInAction(() => {
				postUpdater(postId, "favoritesCount", (prev: number) => prev - (post?.isFavorited ? 1 : -1));
				postUpdater(postId, "isFavorited", (prev: boolean) => !prev);
			});
		}
	};

	// DELETE POST

	deletePost: MobxSaiInstance<void> = {};

	deletePostAction = async () => {
		console.log("delete post action");
		const { checkPostIdProviding, filterPostAfterDelete, restoreDeletedPost } = postServiceStore;
		const {
			selectedPost,
			postDeleteModalOpen: { setPostDeleteModalOpen }
		} = postInteractionsStore;
		const { showNotify } = notifyInteractionsStore;

		if (!checkPostIdProviding("deletePostAction")) return;

		const postId = selectedPost?.id!;
		const notifyData = getDeletePostNotifyData();
		const notifySuccessData = getDeletePostSuccessNotifyData();

		// PRE DELETE POST
		const deletedPostData = filterPostAfterDelete(postId);
		setPostDeleteModalOpen(false);

		try {
			this.deletePost = mobxSaiFetch(deletePost(postId));

			const disposer = reaction(
				() => this.deletePost?.data,
				(data) => {
					if (!data) return;
					console.log("delete post", data);
					showNotify("success", notifySuccessData);
					disposer();
				}
			);
		} catch (err) {
			console.log(err);
			restoreDeletedPost(deletedPostData);
			showNotify("error", notifyData);
		}
	};

	// CREATE POST

	createPost: MobxSaiInstance<GetPostFeedResponse> = {};

	createPostAction = async (images?: string[], propsTempId?: string) => {
		const { uploadSingleFilesAction, uploadVideoAction } = fileActionsStore;
		const {
			createPostStatuses,
			createPostSuccessHandler,
			createPostErrorHandler,
			getPostTempData,
			addTempPost,
			changeCreatePostStatus
		} = postServiceStore;
		const {
			createPostForm: {
				values
			},
			selectedMedias: { selectedMedias }
		} = postInteractionsStore;

		const body: CreatePostBody = {
			canComment: values.canComment,
			title: values.title,
			content: values.content, // TODO: Поменять когда изменю формат текстового редактора
			originalContent: values.content,
			hashtags: values.hashtags,
			tags: values.tags,
			images: images ? images : (selectedMedias.length > 0 ? selectedMedias.map(media => media.uri) : [])
		};

		const tempId = numericId();

		if (!images) {
			const tempData = getPostTempData(tempId);
			const uploadId = `createPost_${tempId}_${generateSimpleUUID()}`;

			addTempPost(tempData);

			let result;

			if (selectedMedias.length > 0) {
				if (createPostStatuses.get(uploadId) !== "fulfilled") {
					if (selectedMedias[0].mediaType === "video") {
						result = await uploadVideoAction(selectedMedias, uploadId);
						changeCreatePostStatus(uploadId, "pending");
						return;
					} else {
						result = await uploadSingleFilesAction(selectedMedias);
					}
				}
			}

			if ((result as any)?.status === "error") {
				console.log("result", result);
				return;
			}
		}

		this.createPost = mobxSaiFetch(
			() => createPostAxios(body),
			{
				id: "createPostAction" + tempId,
				fetchIfHaveData: true
			}
		);

		mobxSaiHandler(
			this.createPost,
			createPostSuccessHandler,
			(err) => createPostErrorHandler(err, propsTempId || tempId)
		);
	};
}

export const postActionsStore = new PostActionsStore();

export const createPostAxios = async (body: CreatePostBody) => (await rust.post("/post/create", body)).data;
export const getPosts = async (params: GetPostsParams) => {
	const realParams: any = {
		limit: params.limit,
		up: params.up,
		newFeed: params.newFeed,
		page: params.page,
		relativeId: "null"
	};

	if (params.q) realParams.q = params.q;

	console.log("realParams", realParams);

	return (await rust.get('/post/feed', {
		params: realParams
	})).data;
};
export const getUserPosts = async (userId: string, params: GetUserPostsParams) => {
	const realParams: GetPostsParams = {
		...params,
		relativeId: params.relativeId ? params.relativeId : "null"
	};
	console.log("getUserPosts", realParams);

	return (await rust.get(`/post/user/${userId}`, { params: realParams })).data;
};
export const likePost = async (postId: number) => (await rust.post(`/post/${postId}/like`)).data;
export const favPost = async (postId: number) => (await rust.post(`/post/${postId}/favorite`)).data;
export const deletePost = async (postId: number | string) => (await rust.delete(`/post/${postId}/delete`)).data;