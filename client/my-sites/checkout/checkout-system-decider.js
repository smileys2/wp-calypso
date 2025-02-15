import config from '@automattic/calypso-config';
import { StripeHookProvider } from '@automattic/calypso-stripe';
import { CheckoutErrorBoundary } from '@automattic/composite-checkout';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import wp from 'calypso/lib/wp';
import Recaptcha from 'calypso/signup/recaptcha';
import { getCurrentUserLocale } from 'calypso/state/current-user/selectors';
import { logToLogstash } from 'calypso/state/logstash/actions';
import CalypsoShoppingCartProvider from './calypso-shopping-cart-provider';
import PrePurchaseNotices from './composite-checkout/components/prepurchase-notices';
import CompositeCheckout from './composite-checkout/composite-checkout';
import { fetchStripeConfiguration } from './composite-checkout/payment-method-helpers';

export default function CheckoutSystemDecider( {
	productAliasFromUrl,
	purchaseId,
	selectedFeature,
	couponCode,
	isComingFromUpsell,
	plan,
	selectedSite,
	redirectTo,
	isLoggedOutCart,
	isNoSiteCart,
	isJetpackCheckout,
	jetpackSiteSlug,
	jetpackPurchaseToken,
	isUserComingFromLoginForm,
} ) {
	const reduxDispatch = useDispatch();
	const translate = useTranslate();
	const locale = useSelector( getCurrentUserLocale );

	const prepurchaseNotices = <PrePurchaseNotices />;

	useEffect( () => {
		if ( productAliasFromUrl ) {
			reduxDispatch(
				logToLogstash( {
					feature: 'calypso_client',
					message: 'CheckoutSystemDecider saw productSlug to add',
					severity: config( 'env_id' ) === 'production' ? 'error' : 'debug',
					extra: {
						productSlug: productAliasFromUrl,
					},
				} )
			);
		}
	}, [ reduxDispatch, productAliasFromUrl ] );

	const logCheckoutError = useCallback(
		( error ) => {
			reduxDispatch(
				logToLogstash( {
					feature: 'calypso_client',
					message: 'composite checkout load error',
					severity: config( 'env_id' ) === 'production' ? 'error' : 'debug',
					extra: {
						env: config( 'env_id' ),
						type: 'checkout_system_decider',
						message: String( error ),
					},
				} )
			);
		},
		[ reduxDispatch ]
	);

	let siteSlug = selectedSite?.slug;

	if ( ! siteSlug ) {
		siteSlug = 'no-site';

		if ( isLoggedOutCart || isNoSiteCart ) {
			siteSlug = 'no-user';
		}
	}

	return (
		<>
			<CheckoutErrorBoundary
				errorMessage={ translate( 'Sorry, there was an error loading this page.' ) }
				onError={ logCheckoutError }
			>
				<CalypsoShoppingCartProvider>
					<StripeHookProvider
						fetchStripeConfiguration={ fetchStripeConfigurationWpcom }
						locale={ locale }
					>
						<CompositeCheckout
							siteSlug={ siteSlug }
							siteId={ selectedSite?.ID }
							productAliasFromUrl={ productAliasFromUrl }
							purchaseId={ purchaseId }
							couponCode={ couponCode }
							redirectTo={ redirectTo }
							feature={ selectedFeature }
							plan={ plan }
							isComingFromUpsell={ isComingFromUpsell }
							infoMessage={ prepurchaseNotices }
							isLoggedOutCart={ isLoggedOutCart }
							isNoSiteCart={ isNoSiteCart }
							isJetpackCheckout={ isJetpackCheckout }
							jetpackSiteSlug={ jetpackSiteSlug }
							jetpackPurchaseToken={ jetpackPurchaseToken }
							isUserComingFromLoginForm={ isUserComingFromLoginForm }
						/>
					</StripeHookProvider>
				</CalypsoShoppingCartProvider>
			</CheckoutErrorBoundary>
			{ isLoggedOutCart && <Recaptcha badgePosition="bottomright" /> }
		</>
	);
}

function fetchStripeConfigurationWpcom( args ) {
	return fetchStripeConfiguration( args, wp );
}
