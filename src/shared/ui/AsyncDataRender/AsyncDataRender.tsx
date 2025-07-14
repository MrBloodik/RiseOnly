import { NoDataAnimation } from '@animations/components/NoDataAnimation';
import { changeRgbA } from '@shared/lib/theme';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { ComponentType, ReactNode, cloneElement, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Box } from '../BoxUi/Box';
import { LoaderUi } from '../LoaderUi/LoaderUi';
import { MainText } from '../MainText/MainText';
import { RefreshControlUi } from '../RefreshControlUi/RefreshControlUi';
import { SkeletonUi } from '../SkeletonUi/SkeletonUi';

export type AsyncDataRenderStatus = "pending" | "fulfilled" | "rejected" | "idle" | undefined;

interface AsyncStateHandlerProps<T> {
	status: AsyncDataRenderStatus;
	data: T | undefined;
	renderContent?: (data: T) => ReactNode;
	renderItem?: ((item: any) => ReactNode) | ComponentType<any> | ReactNode;
	itemPropName?: string;
	loadingComponent?: ReactNode;
	loadingComponentStyle?: StyleProp<ViewStyle>;
	errorComponent?: ReactNode;
	emptyComponent?: ReactNode;
	noDataText?: string;
	isEmpty?: (data: T) => boolean;
	messageHeightPercent?: number;
	noDataHeightPercent?: number;
	needPending?: boolean;
	isSkeleton?: boolean;
	emptyStyle?: StyleProp<ViewStyle>;
	emptyContainerStyle?: StyleProp<ViewStyle>;
	emptyScrollViewStyle?: StyleProp<ViewStyle>;
	isEmptyScrollView?: boolean;
	refreshControllCallback?: () => void;
}

export const AsyncDataRender = observer(<T,>({
	status,
	data,
	renderContent,
	renderItem,
	itemPropName = 'comment',
	loadingComponent,
	errorComponent,
	emptyStyle = {},
	emptyContainerStyle = {},
	emptyComponent,
	emptyScrollViewStyle = {},
	noDataText = "No data",
	noDataHeightPercent = 15,
	isSkeleton = false,
	isEmptyScrollView = true,
	needPending = true,
	loadingComponentStyle = {},
	isEmpty = (data: any) => !data || (Array.isArray(data) ? data.length === 0 : false),
	refreshControllCallback,
	messageHeightPercent = 100,
}: AsyncStateHandlerProps<T>) => {
	const { currentTheme } = themeStore;
	const { t } = useTranslation();

	const messageContainerStyle = StyleSheet.compose(
		styles.centerContainer,
		{
			position: 'absolute',
			top: messageHeightPercent && messageHeightPercent !== 100 ? `${messageHeightPercent}%` : '50%',
			left: 0,
			right: 0,
			justifyContent: messageHeightPercent <= 50 ? 'flex-start' : 'center',
			paddingTop: messageHeightPercent <= 30 ? 10 : 20,
			flex: messageHeightPercent <= 50 ? 0 : 1,
			loadingComponentStyle
		} as any,
	);

	if (status === 'pending') {
		return loadingComponent || (
			<View
				style={messageContainerStyle}
			>
				{isSkeleton ? <SkeletonUi>{renderContent && renderContent(data!)}</SkeletonUi> : <LoaderUi />}
			</View>
		);
	}

	if (status === 'rejected') {
		return errorComponent || (
			<View style={styles.container}>
				<View
					style={{
						position: 'absolute',
						top: messageHeightPercent && messageHeightPercent !== 100 ? `${messageHeightPercent}%` : '50%',
						left: 0,
						right: 0,
						alignItems: 'center',
					}}
				>
					<Text style={[styles.errorText, { color: currentTheme.textColor.color }]}>
						{t('error_fetching_data')}
					</Text>
				</View>
			</View>
		);
	}

	if (status === 'fulfilled') {
		if ((data && isEmpty(data)) || !data) {
			const EmptyComponent = isEmptyScrollView ? ScrollView : View;
			return (
				<EmptyComponent
					style={[styles.container, emptyScrollViewStyle]}
					contentContainerStyle={{ height: "100%" }}
				>
					{refreshControllCallback && <RefreshControlUi callback={refreshControllCallback} />}
					<View style={[
						{
							top: noDataHeightPercent && noDataHeightPercent !== 100 ? `${noDataHeightPercent}%` : '50%',
							left: 0,
							right: 0,
						},
						emptyStyle
					]}>
						<Box centered style={{ position: "relative" }}>
							<NoDataAnimation size={300} />
							<MainText
								px={17}
								fontWeight="bold"
								tac='center'
								style={[
									styles.emptyText,
									{
										color: currentTheme.textColor.color, flex: 1, position: "absolute", bottom: "18%", transform: [
											{ scaleY: 1 },
											{ skewX: "0deg" },
											{ skewY: "0deg" },
										],
										textShadowColor: changeRgbA(themeStore.currentTheme.originalMainGradientColor.color as string, "0.7"),
										textShadowOffset: { width: -1, height: 1 },
										textShadowRadius: 3.5,
									}
								]}
							>
								{noDataText}
							</MainText>
						</Box>
					</View>
				</EmptyComponent>
			);
		}
		if ((data && !isEmpty(data)) || !needPending) {
			if (renderContent) {
				return <>
					{refreshControllCallback && <RefreshControlUi callback={refreshControllCallback} />}
					{renderContent(data!)}
				</>;
			}

			if (Array.isArray(data)) {
				if (renderItem && typeof renderItem === 'function') {
					const isReactComponent =
						typeof renderItem === 'function' &&
						(
							'displayName' in renderItem ||
							(renderItem.prototype && 'isReactComponent' in renderItem.prototype)
						);

					if (isReactComponent) {
						const RenderComponent = renderItem as ComponentType<any>;
						return (
							<>
								{data.map((item, index) => {
									const props = {
										key: item.id || index,
										[itemPropName]: item
									};
									return <RenderComponent {...props} />;
								})}
							</>
						);
					} else {
						const renderFunction = renderItem as (item: any) => ReactNode;
						return (
							<>
								{data.map((item, index) => {
									const key = item.id || index;
									return (
										<React.Fragment key={key}>
											{renderFunction(item)}
										</React.Fragment>
									);
								})}
							</>
						);
					}
				}
				else if (renderItem && isValidElement(renderItem)) {
					return (
						<>
							{data.map((item, index) => {
								const props = {
									key: item.id || index,
									[itemPropName]: item
								};
								return cloneElement(renderItem, props);
							})}
						</>
					);
				}
			}

			return <>{data}</>;
		}
	}

	return null;
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		width: "100%",
		height: "100%",
	},
	messageContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		padding: 20,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		textAlign: 'center',
	},
	emptyText: {
		textAlign: 'center',
	},
});
