/**
 * MySitesSidebarUnifiedMenu
 *
 * Renders a top level menu item with children.
 * This item can be expanded and collapsed by clicking.
 */

import { isWithinBreakpoint } from '@automattic/viewport';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import SidebarCustomIcon from 'calypso/layout/sidebar/custom-icon';
import ExpandableSidebarMenu from 'calypso/layout/sidebar/expandable';
import { navigate } from 'calypso/lib/navigate';
import { toggleMySitesSidebarSection as toggleSection } from 'calypso/state/my-sites/sidebar/actions';
import { isSidebarSectionOpen } from 'calypso/state/my-sites/sidebar/selectors';
import MySitesSidebarUnifiedItem from './item';
import { itemLinkMatches } from './utils';

export const MySitesSidebarUnifiedMenu = ( {
	count,
	slug,
	title,
	icon,
	children,
	path,
	link,
	selected,
	sidebarCollapsed,
	isHappychatSessionActive,
	isJetpackNonAtomicSite,
	continueInCalypso,
	...props
} ) => {
	const reduxDispatch = useDispatch();
	const sectionId = 'SIDEBAR_SECTION_' + slug;
	const isExpanded = useSelector( ( state ) => isSidebarSectionOpen( state, sectionId ) );
	const selectedMenuItem =
		Array.isArray( children ) &&
		children.find( ( menuItem ) => menuItem?.url && itemLinkMatches( menuItem.url, path ) );
	const childIsSelected = !! selectedMenuItem;
	const showAsExpanded =
		( ! isWithinBreakpoint( '>782px' ) && ( childIsSelected || isExpanded ) ) || // For mobile breakpoints, we dont' care about the sidebar collapsed status.
		( isWithinBreakpoint( '>782px' ) && childIsSelected && ! sidebarCollapsed ); // For desktop breakpoints, a child should be selected and the sidebar being expanded.

	const onClick = () => {
		// Only open the page if menu is NOT full-width, otherwise just open / close the section instead of directly redirecting to the section.
		if ( isWithinBreakpoint( '>782px' ) ) {
			if ( link ) {
				if ( ! continueInCalypso( link ) ) {
					return;
				}

				navigate( link );
			}
		}

		window.scrollTo( 0, 0 );
		reduxDispatch( toggleSection( sectionId ) );
	};

	return (
		<li>
			<ExpandableSidebarMenu
				onClick={ () => onClick() }
				expanded={ showAsExpanded }
				title={ title }
				customIcon={ <SidebarCustomIcon icon={ icon } /> }
				className={ ( selected || childIsSelected ) && 'sidebar__menu--selected' }
				count={ count }
				hideExpandableIcon={ true }
				inlineText={ props.inlineText }
				{ ...props }
			>
				{ children.map( ( item ) => {
					const isSelected = selectedMenuItem?.url === item.url;
					return (
						<MySitesSidebarUnifiedItem
							key={ item.title }
							{ ...item }
							selected={ isSelected }
							isSubItem={ true }
							isHappychatSessionActive={ isHappychatSessionActive }
							isJetpackNonAtomicSite={ isJetpackNonAtomicSite }
							continueInCalypso={ continueInCalypso }
						/>
					);
				} ) }
			</ExpandableSidebarMenu>
		</li>
	);
};

MySitesSidebarUnifiedMenu.propTypes = {
	count: PropTypes.number,
	path: PropTypes.string,
	slug: PropTypes.string,
	title: PropTypes.string,
	icon: PropTypes.string,
	children: PropTypes.array.isRequired,
	link: PropTypes.string,
	sidebarCollapsed: PropTypes.bool,
	isHappychatSessionActive: PropTypes.bool.isRequired,
	isJetpackNonAtomicSite: PropTypes.bool.isRequired,
	continueInCalypso: PropTypes.func.isRequired,
	/*
	Example of children shape:
	[
		{
			"title": "Settings",
			"url": "https://wp.com",
			"icon": null,
			"type": "menu-item"
		},
		{
			"title": "Domains",
			"url": "https://wp.com",
			"icon": null,
			"type": "menu-item"
		},
		{
			"title": "Debug Bar Extender",
			"url": "https://wp.com",
			"icon": null,
			"type": "menu-item"
		},
		{
			"title": "Hosting Configuration",
			"url": "https://wp.com",
			"icon": null,
			"type": "menu-item"
		}
	]
	*/
};

export default MySitesSidebarUnifiedMenu;
