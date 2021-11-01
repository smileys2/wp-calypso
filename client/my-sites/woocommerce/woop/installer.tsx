import { Button, CompactCard, ProgressBar } from '@automattic/components';
import { Spinner } from '@wordpress/components';
import { ReactElement, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { default as HoldList } from 'calypso/blocks/eligibility-warnings/hold-list';
import WarningList from 'calypso/blocks/eligibility-warnings/warning-list';
import Main from 'calypso/components/main';
import {
	fetchAutomatedTransferStatusOnce,
	fetchAutomatedTransferStatus,
	requestEligibility,
} from 'calypso/state/automated-transfer/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import {
	isFetchingAutomatedTransferStatus,
	getAutomatedTransferStatus,
	isEligibleForAutomatedTransfer,
	getEligibility,
	EligibilityData,
} from 'calypso/state/automated-transfer/selectors';
import { fetchSitePlugins, installPlugin } from 'calypso/state/plugins/installed/actions';
import { isRequesting, getPluginOnSite } from 'calypso/state/plugins/installed/selectors';
import isEligibleForWooOnPlans from 'calypso/state/selectors/is-eligible-for-woo-on-plans';
import isSiteWpcomAtomic from 'calypso/state/selectors/is-site-wpcom-atomic';
import { isRequestingSite, getSiteWooCommerceUrl } from 'calypso/state/sites/selectors';
import { initiateThemeTransfer } from 'calypso/state/themes/actions';
import { hasUploadFailed, getUploadError } from 'calypso/state/themes/upload-theme/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import WooCommerceColophon from '../woocommerce-colophon';
import type { AppState } from 'calypso/types';

import './style.scss';

export default function Installer(): ReactElement | null {
	const siteId = useSelector( getSelectedSiteId ) as number;

	// Store wizard step in state.
	const [ step, setStep ] = useState( 'landing' );

	const fetchingSite = useSelector( ( state: AppState ) => isRequestingSite( state, siteId ) );
	const isAtomic = useSelector( ( state ) => isSiteWpcomAtomic( state, siteId ) );

	const fetchingPlugins = useSelector( ( state: AppState ) => isRequesting( state, siteId ) );
	const wooInstalled = !! useSelector( ( state ) =>
		getPluginOnSite( state, siteId, 'woocommerce' )
	);

	const fetchingTransferStatus = !! useSelector( ( state: AppState ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);
	const transferStatus = useSelector( ( state: AppState ) =>
		getAutomatedTransferStatus( state, siteId )
	);

	const eligibleForWooOnPlans = useSelector( ( state ) =>
		isEligibleForWooOnPlans( state, siteId )
	);
	const eligibleForTransfer = useSelector( ( state ) =>
		isEligibleForAutomatedTransfer( state, siteId )
	);

	const { eligibilityHolds, eligibilityWarnings }: EligibilityData = useSelector( ( state ) =>
		getEligibility( state, siteId )
	);

	// const transferInProgress = useSelector( ( state: AppState ) =>
	// 	isUploadInProgress( state, siteId )
	// );
	const transferFailed = useSelector( ( state: AppState ) => hasUploadFailed( state, siteId ) );
	const transferError = useSelector( ( state: AppState ) => getUploadError( state, siteId ) );

	// const progress = useSelector( ( state: AppState ) => getUploadProgressLoaded( state, siteId ) );
	// const progressTotal = useSelector( ( state: AppState ) =>
	// 	getUploadProgressTotal( state, siteId )
	// );

	const steps: Record< string, Step > = {
		landing: LandingStep,
		confirm: ConfirmStep,
		transfer: TransferStep,
		transferError: TransferErrorStep,
		check: CheckStep,
		install: InstallStep,
		wcadmin: WCAdminStep,
	};

	const CurrentStep = steps[ step ];

	return (
		<div className="woop">
			<Main className="woop__main main" wideLayout>
				<CurrentStep setStep={ setStep } siteId={ siteId } />
			</Main>
			<WooCommerceColophon />
			<pre>
				{ JSON.stringify(
					{
						currentStep: step,
						fetchingSite,
						fetchingPlugins,
						fetchingTransferStatus,
						transferStatus,
						isAtomic,
						wooInstalled,
						eligibleForWooOnPlans,
						eligibleForTransfer,
						eligibilityHolds,
						eligibilityWarnings,
						transferFailed,
						transferError,
					},
					null,
					2
				) }
			</pre>
		</div>
	);
}

interface StepProps {
	setStep: ( step: string ) => void;
	siteId: number;
}
// wooInstalled: boolean;
// isAtomic: boolean;
// setTransferConfirmed: Dispatch< SetStateAction< boolean > >;
// eligibilityHolds: string[];
// eligibilityWarnings: EligibilityWarning[];

type Step = ( props: StepProps ) => ReactElement | null;

function LandingStep( { setStep, siteId }: StepProps ): ReactElement | null {
	// const transferStatus = useSelector( ( state: AppState ) =>
	// 	getAutomatedTransferStatus( state, siteId )
	// );

	const [ loading, setLoading ] = useState( true );

	const dispatch = useDispatch();
	useEffect( () => {
		if ( ! siteId ) {
			return;
		}
		dispatch( fetchAutomatedTransferStatusOnce( siteId ) );
		dispatch( requestEligibility( siteId ) );
		dispatch( fetchSitePlugins( siteId ) );
	}, [ siteId, dispatch ] );

	const wcAdminUrl = useSelector( ( state ) => getSiteWooCommerceUrl( state, siteId ) ) || '/';

	const fetchingSite = useSelector( ( state: AppState ) => isRequestingSite( state, siteId ) );
	const isAtomic = useSelector( ( state ) => isSiteWpcomAtomic( state, siteId ) );

	const fetchingPlugins = useSelector( ( state: AppState ) => isRequesting( state, siteId ) );
	const wooInstalled = !! useSelector( ( state ) =>
		getPluginOnSite( state, siteId, 'woocommerce' )
	);
	// console.log( wooInstalled );

	const fetchingTransferStatus = !! useSelector( ( state: AppState ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);

	useEffect( () => {
		if ( fetchingSite || fetchingPlugins || fetchingTransferStatus ) {
			setLoading( true );
			return;
		}
		setLoading( false );
	}, [ fetchingSite, fetchingPlugins, fetchingTransferStatus ] );

	let cta = null;

	if ( wooInstalled ) {
		cta = (
			<Button href={ wcAdminUrl } disabled={ loading }>
				Open WooCommerce
			</Button>
		);
	} else if ( isAtomic ) {
		cta = (
			<Button
				onClick={ () => setStep( 'install' /* todo: replace with onboarding flow */ ) }
				disabled={ loading }
			>
				Install WooCommerce
			</Button>
		);
	} else {
		cta = (
			<Button disabled={ loading } onClick={ () => setStep( 'confirm' ) }>
				Install WooCommerce
			</Button>
		);
	}

	return (
		<div className="woop__landing-step">
			<p>LandingStep</p>
			{ loading && <Spinner /> }
			{ cta }
		</div>
	);
}

// interface Site {
// 	siteId?: number;
// 	slug?: string;
// }

function ConfirmStep( { setStep, siteId }: StepProps ): ReactElement | null {
	// const eligibleForWooOnPlans = useSelector( ( state ) =>
	// 	isEligibleForWooOnPlans( state, siteId )
	// );

	// const eligibleForTransfer = useSelector( ( state ) =>
	// 	isEligibleForAutomatedTransfer( state, siteId )
	// );

	const { eligibilityHolds, eligibilityWarnings }: EligibilityData = useSelector( ( state ) =>
		getEligibility( state, siteId )
	);

	return (
		<div>
			<p>ConfirmStep</p>
			{ !! eligibilityHolds?.length && (
				<CompactCard>
					<HoldList holds={ eligibilityHolds } context={ 'plugins' } isPlaceholder={ false } />
				</CompactCard>
			) }
			{ !! eligibilityWarnings?.length && (
				<CompactCard>
					<WarningList warnings={ eligibilityWarnings } context={ 'plugins' } />
				</CompactCard>
			) }

			<Button
				onClick={ () => {
					setStep( 'transfer' );
				} }
			>
				Confirm Transfer
			</Button>
		</div>
	);
}

function TransferStep( { setStep, siteId }: StepProps ): ReactElement | null {
	const [ progress, setProgress ] = useState( 0 );

	// Select state
	const fetchingTransferStatus = !! useSelector( ( state: AppState ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);
	const transferStatus = useSelector( ( state: AppState ) =>
		getAutomatedTransferStatus( state, siteId )
	);

	const transferFailed = useSelector( ( state: AppState ) => hasUploadFailed( state, siteId ) );

	// Initiate Atomic transfer
	const dispatch = useDispatch();
	useEffect( () => {
		if ( ! siteId ) {
			return;
		}

		dispatch( fetchAutomatedTransferStatus( siteId ) ); // todo: only need this for debugging display polling kicked off by initiate theme transfer
		dispatch( initiateThemeTransfer( siteId, null, [ 'woocommerce', 'woocommerce-payments' ] ) );
		// todo: add plugins option to this endpoint:
		// dispatch( initiateThemeTransfer( siteId, null, '', [ 'woocommerce', 'woocommerce-payments' ] ) );
	}, [ siteId, dispatch ] );

	// Watch transfer status
	useEffect( () => {
		if ( fetchingTransferStatus ) {
			return;
		}

		switch ( transferStatus ) {
			case transferStates.NONE:
			case transferStates.PENDING:
			case transferStates.INQUIRING:
			case transferStates.PROVISIONED:
			case transferStates.FAILURE:
			case transferStates.START:
			case transferStates.REVERTED:
				setProgress( 10 );
				break;
			case transferStates.SETUP:
			case transferStates.CONFLICTS:
			case transferStates.ACTIVE:
				setProgress( 30 );
				break;
			case transferStates.UPLOADING:
			case transferStates.BACKFILLING:
				setProgress( 50 );
				break;
			case transferStates.COMPLETE:
				setProgress( 60 );
				setStep( 'check' );
				break;
		}

		if (
			transferFailed ||
			transferStatus === transferStates.ERROR ||
			transferStatus === transferStates.FAILURE ||
			transferStatus === transferStates.REQUEST_FAILURE ||
			transferStatus === transferStates.CONFLICTS
		) {
			setStep( 'transferError' );
		}
	}, [ setProgress, setStep, fetchingTransferStatus, transferStatus, transferFailed ] );

	const wooInstalled = !! useSelector( ( state ) =>
		getPluginOnSite( state, siteId, 'woocommerce' )
	);

	const wooPayInstalled = !! useSelector( ( state ) =>
		getPluginOnSite( state, siteId, 'woocommerce-payments' )
	);

	// woo-blocks id: woo-gutenberg-products-block/woocommerce-gutenberg-products-block
	// woo-blocks slug: woo-gutenberg-products-block
	// woo-payments id: woocommerce-payments/woocommerce-payments
	// woo-payments slug: woocommerce-payments

	// Initiate Plugin Install
	// useEffect( () => {
	// 	if ( transferStatus === transferStates.COMPLETE ) {
	// 		dispatch( installPlugin( siteId, { id: 'woocommerce/woocommerce', slug: 'woocommerce' } ) );
	// 		setProgress( 90 );
	// 	}
	// }, [ setProgress, transferStatus, dispatch, siteId ] );

	// useEffect( () => {
	// 	if ( wooInstalled ) {
	// 		// dispatch( installPlugin( siteId, { id: 'woocommerce-payments/woocommerce-payments', slug: 'woocommerce-payments' } ) );
	// 		setProgress( 95 );
	// 		setStep( 'check' );
	// 	}
	// }, [ setProgress, dispatch, siteId, wooInstalled ] );

	// useEffect( () => {
	// 	if ( wooPayInstalled ) {
	// 		setProgress( 100 );
	// 		setStep( 'check' );
	// 	}
	// }, [ setProgress, setStep, wooPayInstalled ] );

	// todo: update site options with onboarding info
	// useEffect( () => {
	// 	if ( fetchingTransferStatus ) {
	// 		return;
	// 	}
	// 	if ( transferStatus === transferStates.COMPLETE ) {
	// 		dispatch( 'check' );
	// 	}
	// }, [ setProgress, setStep, fetchingTransferStatus, transferStatus ] );

	return (
		<div className="woop__transfer-step">
			<p>Atomic transfer initiated...</p>
			<ProgressBar value={ progress || 1 } total={ 100 } isPulsing />
		</div>
	);
}
function TransferErrorStep( { setStep, siteId }: StepProps ): ReactElement | null {
	const transferError = useSelector( ( state: AppState ) => getUploadError( state, siteId ) );

	return (
		<div>
			<p>TransferErrorStep</p>
			<p>{ transferError.error }</p>
			<p>{ transferError.name }</p>
			<p>{ transferError.message }</p>
			<Button onClick={ () => setStep( 'check' ) }>Go Check</Button>
		</div>
	);
}

function CheckStep( { setStep }: StepProps ): ReactElement | null {
	return (
		<div>
			<p>Atomic transfer complete</p>
			<Button onClick={ () => setStep( 'install' ) }>Install plugins</Button>
		</div>
	);
}

function InstallStep( { setStep }: StepProps ): ReactElement | null {
	return (
		<div>
			<p>InstallStep</p>
			<Button onClick={ () => setStep( 'WCAdmin' ) }>Go wc-admin</Button>
		</div>
	);
}

function WCAdminStep( { setStep }: StepProps ): ReactElement | null {
	return (
		<div>
			<p>WCAdminStep</p>
			<Button onClick={ () => setStep( 'loading' ) }>done</Button>
		</div>
	);
}
