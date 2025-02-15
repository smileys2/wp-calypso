import { translate } from 'i18n-calypso';
import wp from 'calypso/lib/wp';
import {
	BILLING_RECEIPT_EMAIL_SEND,
	BILLING_RECEIPT_EMAIL_SEND_FAILURE,
	BILLING_RECEIPT_EMAIL_SEND_SUCCESS,
	BILLING_TRANSACTIONS_RECEIVE,
	BILLING_TRANSACTIONS_REQUEST,
	BILLING_TRANSACTIONS_REQUEST_FAILURE,
	BILLING_TRANSACTIONS_REQUEST_SUCCESS,
} from 'calypso/state/action-types';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';

import 'calypso/state/billing-transactions/init';

export const requestBillingTransactions = () => {
	return ( dispatch ) => {
		dispatch( {
			type: BILLING_TRANSACTIONS_REQUEST,
		} );

		return wp
			.undocumented()
			.billingHistory()
			.then( ( { billing_history, upcoming_charges } ) => {
				dispatch( {
					type: BILLING_TRANSACTIONS_RECEIVE,
					past: billing_history,
					upcoming: upcoming_charges,
				} );
				dispatch( {
					type: BILLING_TRANSACTIONS_REQUEST_SUCCESS,
				} );
			} )
			.catch( ( error ) => {
				dispatch( {
					type: BILLING_TRANSACTIONS_REQUEST_FAILURE,
					error,
				} );
			} );
	};
};

export const sendBillingReceiptEmail = ( receiptId ) => {
	return ( dispatch ) => {
		dispatch( {
			type: BILLING_RECEIPT_EMAIL_SEND,
			receiptId,
		} );

		return wp
			.undocumented()
			.me()
			.billingHistoryEmailReceipt( receiptId )
			.then( () => {
				dispatch( {
					type: BILLING_RECEIPT_EMAIL_SEND_SUCCESS,
					receiptId,
				} );
				dispatch( successNotice( translate( 'Your receipt was sent by email successfully.' ) ) );
			} )
			.catch( ( error ) => {
				dispatch( {
					type: BILLING_RECEIPT_EMAIL_SEND_FAILURE,
					receiptId,
					error,
				} );
				dispatch(
					errorNotice(
						translate(
							'There was a problem sending your receipt. Please try again later or contact support.'
						)
					)
				);
			} );
	};
};
