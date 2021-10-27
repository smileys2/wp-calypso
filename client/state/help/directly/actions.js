import * as directly from 'calypso/lib/directly';
import {
	DIRECTLY_ASK_QUESTION,
	DIRECTLY_INITIALIZATION_START,
	DIRECTLY_INITIALIZATION_SUCCESS,
	DIRECTLY_INITIALIZATION_ERROR,
} from 'calypso/state/action-types';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import 'calypso/state/help/init';

export const askQuestion = ( questionText, name, email ) => ( dispatch ) => {
	dispatch( { type: DIRECTLY_ASK_QUESTION } );
	return directly
		.askQuestion( questionText, name, email )
		.then( () => dispatch( recordTracksEvent( 'calypso_directly_ask_question' ) ) );
};

export const initialize = () => ( dispatch ) => {
	dispatch( { type: DIRECTLY_INITIALIZATION_START } );
	dispatch( recordTracksEvent( 'calypso_directly_initialization_start' ) );

	return directly
		.initialize()
		.then( () => {
			dispatch( recordTracksEvent( 'calypso_directly_initialization_success' ) );
			dispatch( { type: DIRECTLY_INITIALIZATION_SUCCESS } );
		} )
		.catch( ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_directly_initialization_error', {
					error: error ? error.toString() : 'Unknown error',
				} )
			);
			dispatch( { type: DIRECTLY_INITIALIZATION_ERROR } );
		} );
};
