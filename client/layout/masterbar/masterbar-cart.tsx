import { CheckoutProvider, Button } from '@automattic/composite-checkout';
import { useShoppingCart } from '@automattic/shopping-cart';
import { useTranslate } from 'i18n-calypso';
import { MasterbarCartLineItems } from './masterbar-cart-line-items';
import type { ResponseCart } from '@automattic/shopping-cart';

import './masterbar-cart-style.scss';

function MasterbarCartTotal( { responseCart }: { responseCart: ResponseCart } ) {
	const translate = useTranslate();
	return (
		<div className="masterbar-cart__total">
			<span>{ translate( 'Total' ) }</span>
			<span>{ responseCart.total_cost_display }</span>
		</div>
	);
}

export function MasterbarCart( {
	selectedSiteSlug,
	goToCheckout,
}: {
	selectedSiteSlug: string;
	goToCheckout: ( siteSlug: string ) => void;
} ): JSX.Element {
	const {
		responseCart,
		removeCoupon,
		removeProductFromCart,
		isLoading,
		isPendingUpdate,
	} = useShoppingCart( selectedSiteSlug );
	const translate = useTranslate();
	const isDisabled = isLoading || isPendingUpdate;
	const isPwpoUser = false; // TODO: deal with this properly

	return (
		<CheckoutProvider paymentMethods={ [] } paymentProcessors={ {} }>
			<div className="masterbar-cart">
				<div className="masterbar-cart__header">
					<h2 className="masterbar-cart__title">{ translate( 'Cart' ) }</h2>
					<span className="masterbar-cart__site-title">
						{ translate( 'Site: %s', {
							args: selectedSiteSlug,
						} ) }
					</span>
				</div>
				<MasterbarCartLineItems
					removeCoupon={ removeCoupon }
					removeProductFromCart={ removeProductFromCart }
					responseCart={ responseCart }
					isPwpoUser={ isPwpoUser }
				/>
				<MasterbarCartTotal responseCart={ responseCart } />
				<div className="masterbar-cart__footer">
					<Button
						className="masterbar-cart__checkout"
						buttonType={ 'primary' }
						fullWidth
						disabled={ isDisabled }
						isBusy={ isDisabled }
						onClick={ () => goToCheckout( selectedSiteSlug ) }
					>
						{ translate( 'Checkout' ) }
					</Button>
				</div>
			</div>
		</CheckoutProvider>
	);
}
