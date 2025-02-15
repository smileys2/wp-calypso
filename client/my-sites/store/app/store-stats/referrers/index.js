import { localize } from 'i18n-calypso';
import { find } from 'lodash';
import page from 'page';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import titlecase from 'to-title-case';
import QuerySiteStats from 'calypso/components/data/query-site-stats';
import JetpackColophon from 'calypso/components/jetpack-colophon';
import Main from 'calypso/components/main';
import SearchCard from 'calypso/components/search-card';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import getStoreReferrersByDate from 'calypso/state/selectors/get-store-referrers-by-date';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { UNITS, noDataMsg } from '../constants';
import Module from '../store-stats-module';
import StoreStatsPeriodNav from '../store-stats-period-nav';
import StoreStatsReferrerConvWidget from '../store-stats-referrer-conv-widget';
import StoreStatsReferrerWidget from '../store-stats-referrer-widget';
import { getEndPeriod, getWidgetPath } from '../utils';
import Chart from './chart';
import { sortBySales } from './helpers';

const STAT_TYPE = 'statsStoreReferrers';
const LIMIT = 10;

class Referrers extends Component {
	static propTypes = {
		siteId: PropTypes.number,
		query: PropTypes.object.isRequired,
		data: PropTypes.array.isRequired,
		selectedDate: PropTypes.string,
		unit: PropTypes.oneOf( [ 'day', 'week', 'month', 'year' ] ),
		slug: PropTypes.string,
		limit: PropTypes.number,
	};

	state = {
		filter: '',
		selectedReferrer: {},
	};

	UNSAFE_componentWillReceiveProps( nextProps ) {
		this.setData( nextProps, this.state.filter );
	}

	UNSAFE_componentWillMount() {
		this.setData( this.props, this.state.filter );
	}

	onSearch = ( str ) => {
		const trimmedStr = str.trim();
		if ( trimmedStr === '' ) {
			const { unit, slug } = this.props;
			const basePath = '/store/stats/referrers';
			const {
				queryParams: { referrer, ...queryParams },
			} = this.props;
			const widgetPath = getWidgetPath( unit, slug, queryParams );
			this.state.filter = '';
			this.state.selectedReferrer = {};
			page( `${ basePath }${ widgetPath }` );
		}
		this.setData( this.props, trimmedStr );
	};

	getFilteredData = ( filter, { data } ) => {
		const filteredData = filter
			? data.filter( ( d ) => d.referrer.toLowerCase().match( filter.toLowerCase() ) )
			: data;
		return {
			filteredSortedData: sortBySales( filteredData ),
		};
	};

	getSelectedReferrer = ( filteredSortedData, { queryParams } ) => {
		let selectedReferrerIndex = null;
		if ( queryParams.referrer ) {
			const selectedReferrer = find( filteredSortedData, ( d, idx ) => {
				if ( queryParams.referrer === d.referrer ) {
					selectedReferrerIndex = idx;
					return true;
				}
				return false;
			} );
			return {
				selectedReferrer: selectedReferrer || {},
				selectedReferrerIndex,
			};
		}

		return {
			selectedReferrer: {},
			selectedReferrerIndex,
		};
	};

	setData( props, filter ) {
		const { filteredSortedData } = this.getFilteredData( filter, props );
		const { selectedReferrer, selectedReferrerIndex } = this.getSelectedReferrer(
			filteredSortedData,
			props
		);
		this.setState( {
			filter,
			filteredSortedData,
			selectedReferrer,
			selectedReferrerIndex,
		} );
	}
	render() {
		const { siteId, query, selectedDate, unit, slug, translate, queryParams } = this.props;
		const { filter, filteredSortedData, selectedReferrer, selectedReferrerIndex } = this.state;
		const endSelectedDate = getEndPeriod( selectedDate, unit );
		const title = `${ translate( 'Store Referrers' ) }: ${
			queryParams.referrer || translate( 'All' )
		}`;
		const chartFormat = UNITS[ unit ].chartFormat;
		const periodNavQueryParams = Object.assign(
			{ referrer: selectedReferrer.referrer },
			queryParams
		);
		const selectOrFilter = selectedReferrer ? selectedReferrer.referrer : filter;
		return (
			<Main className="referrers woocommerce" wideLayout>
				<PageViewTracker
					path={ `/store/stats/referrers/${ unit }/:site` }
					title={ `Store > Stats > Referrers > ${ titlecase( unit ) }` }
				/>
				{ siteId && <QuerySiteStats statType={ STAT_TYPE } siteId={ siteId } query={ query } /> }
				<StoreStatsPeriodNav
					type="referrers"
					selectedDate={ selectedDate }
					unit={ unit }
					slug={ slug }
					query={ query }
					statType={ STAT_TYPE }
					title={ title }
					queryParams={ periodNavQueryParams }
				/>
				<Module
					className="referrers__search"
					siteId={ siteId }
					emptyMessage={ noDataMsg }
					query={ query }
					statType={ STAT_TYPE }
				>
					<SearchCard
						className={ 'referrers__search-filter' }
						onSearch={ this.onSearch }
						placeholder="Filter Store Referrers"
						value={ selectOrFilter }
						initialValue={ selectOrFilter }
					/>
					<div className="referrers__widgets">
						<StoreStatsReferrerWidget
							fetchedData={ filteredSortedData }
							unit={ unit }
							siteId={ siteId }
							query={ query }
							statType={ STAT_TYPE }
							endSelectedDate={ endSelectedDate }
							queryParams={ queryParams }
							slug={ slug }
							limit={ 5 }
							pageType="referrers"
							paginate
							selectedIndex={ selectedReferrerIndex }
							selectedReferrer={ selectedReferrer.referrer }
						/>
					</div>
				</Module>
				<Module
					className="referrers__chart"
					siteId={ siteId }
					emptyMessage={ noDataMsg }
					query={ query }
					statType={ STAT_TYPE }
				>
					<Chart
						selectedDate={ endSelectedDate }
						selectedReferrer={ selectedReferrer.referrer }
						chartFormat={ chartFormat }
						unit={ unit }
						slug={ slug }
						siteId={ siteId }
						statType
						query={ query }
					/>
				</Module>
				<Module
					className="referrers__search"
					siteId={ siteId }
					emptyMessage={ noDataMsg }
					query={ query }
					statType={ STAT_TYPE }
				>
					<div className="referrers__widgets">
						<StoreStatsReferrerConvWidget
							fetchedData={ filteredSortedData }
							unit={ unit }
							siteId={ siteId }
							query={ query }
							statType={ STAT_TYPE }
							endSelectedDate={ endSelectedDate }
							queryParams={ queryParams }
							slug={ slug }
							limit={ LIMIT }
							pageType="referrers"
							paginate
							selectedIndex={ selectedReferrerIndex }
							selectedReferrer={ selectedReferrer.referrer }
						/>
					</div>
				</Module>
				<JetpackColophon />
			</Main>
		);
	}
}

export default connect( ( state, { query, selectedDate, unit } ) => {
	const siteId = getSelectedSiteId( state );
	return {
		slug: getSelectedSiteSlug( state ),
		siteId,
		data: getStoreReferrersByDate( state, {
			query,
			siteId,
			statType: STAT_TYPE,
			endSelectedDate: getEndPeriod( selectedDate, unit ),
		} ),
	};
} )( localize( Referrers ) );
