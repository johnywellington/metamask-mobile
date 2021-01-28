import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import Modal from 'react-native-modal';
import { fromTokenMinimalUnit, hexToBN, toTokenMinimalUnit } from '../../../../util/number';
import { getSwapsQuotesNavbar } from '../../Navbar';
import CustomGas from '../../CustomGas';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import EditPermission from '../../ApproveTransactionReview/EditPermission';
import { decodeApproveData, generateApproveData } from '../../../../util/transactions';
import { SWAPS_CONTRACT_ADDRESS } from '@estebanmino/controllers/dist/swaps/SwapsUtil';
import AnimatedTransactionModal from '../../AnimatedTransactionModal';

const EDIT_MODE_GAS = 'EDIT_MODE_GAS';
const EDIT_MODE_APPROVE_AMOUNT = 'EDIT_MODE_APPROVE_AMOUNT';

const styles = StyleSheet.create({
	keyboardAwareWrapper: {
		flex: 1,
		justifyContent: 'flex-end'
	},
	bottomModal: {
		justifyContent: 'flex-end',
		margin: 0
	}
});

function TransactionsEditionModal({
	apiGasPrice,
	approvalTransaction: originalApprovalTransaction,
	editQuoteTransactionsMode,
	editQuoteTransactionsVisible,
	gasLimit,
	gasPrice,
	onCancelEditQuoteTransactions,
	onHandleGasFeeSelection,
	selectedQuote,
	sourceToken
}) {
	/* Approval transaction if any */
	const [approvalTransactionAmount, setApprovalTransactionAmount] = useState(null);
	const [approvalCustomValue, setApprovalCustomValue] = useState('');
	const [spendLimitUnlimitedSelected, setSpendLimitUnlimitedSelected] = useState(true);
	const [approvalTransaction, setApprovalTransaction] = useState(originalApprovalTransaction);
	const [currentGasSelector, setCurrentGasSelector] = useState(null);

	const onSpendLimitCustomValueChange = approvalCustomValue => setApprovalCustomValue(approvalCustomValue);
	const onPressSpendLimitUnlimitedSelected = () => setSpendLimitUnlimitedSelected(true);
	const onPressSpendLimitCustomSelected = () => setSpendLimitUnlimitedSelected(false);

	const onSetApprovalAmount = () => {
		if (!spendLimitUnlimitedSelected) {
			// calculate new tx data
			// generate value in minimal units
			const uint = toTokenMinimalUnit(approvalCustomValue, sourceToken.decimals).toString();
			const approvalData = generateApproveData({
				spender: SWAPS_CONTRACT_ADDRESS,
				value: Number(uint).toString(16)
			});
			const newApprovalTransaction = { ...approvalTransaction, data: approvalData };
			setApprovalTransaction(newApprovalTransaction);
		}
		onCancelEditQuoteTransactions();
	};

	const onPressGasSelector = gasSelector => {
		setCurrentGasSelector(gasSelector);
	};

	useEffect(() => {
		setApprovalTransaction(originalApprovalTransaction);
		if (originalApprovalTransaction) {
			const approvalTransactionAmount = decodeApproveData(originalApprovalTransaction.data).encodedAmount;
			const amountDec = hexToBN(approvalTransactionAmount).toString();
			setApprovalTransactionAmount(fromTokenMinimalUnit(amountDec, sourceToken.decimals));
		}
	}, [originalApprovalTransaction, sourceToken.decimals]);
	return (
		<Modal
			isVisible={editQuoteTransactionsVisible}
			animationIn="slideInUp"
			animationOut="slideOutDown"
			style={styles.bottomModal}
			backdropOpacity={0.7}
			animationInTiming={600}
			animationOutTiming={600}
			onBackdropPress={onCancelEditQuoteTransactions}
			onBackButtonPress={onCancelEditQuoteTransactions}
			onSwipeComplete={onCancelEditQuoteTransactions}
			swipeDirection={'down'}
			propagateSwipe
		>
			<KeyboardAwareScrollView contentContainerStyle={styles.keyboardAwareWrapper}>
				{editQuoteTransactionsMode === EDIT_MODE_APPROVE_AMOUNT && !!approvalTransaction && (
					<EditPermission
						host={'Swaps'}
						spendLimitUnlimitedSelected={spendLimitUnlimitedSelected}
						tokenSymbol={sourceToken.symbol}
						spendLimitCustomValue={approvalCustomValue}
						originalApproveAmount={approvalTransactionAmount}
						onSetApprovalAmount={onSetApprovalAmount}
						onSpendLimitCustomValueChange={onSpendLimitCustomValueChange}
						onPressSpendLimitUnlimitedSelected={onPressSpendLimitUnlimitedSelected}
						onPressSpendLimitCustomSelected={onPressSpendLimitCustomSelected}
						toggleEditPermission={onCancelEditQuoteTransactions}
					/>
				)}
				{editQuoteTransactionsMode === EDIT_MODE_GAS && (
					<AnimatedTransactionModal onModeChange={onCancelEditQuoteTransactions} ready review={() => null}>
						<CustomGas
							gasSpeedSelected={currentGasSelector}
							onPress={onPressGasSelector}
							handleGasFeeSelection={onHandleGasFeeSelection}
							basicGasEstimates={apiGasPrice}
							gas={hexToBN(gasLimit)}
							gasPrice={hexToBN(gasPrice)}
							gasError={null}
							mode={'edit'}
							customTransaction={selectedQuote.trade}
						/>
					</AnimatedTransactionModal>
				)}
			</KeyboardAwareScrollView>
		</Modal>
	);
}

TransactionsEditionModal.propTypes = {
	apiGasPrice: PropTypes.object,
	approvalTransaction: PropTypes.object,
	editQuoteTransactionsMode: PropTypes.string,
	editQuoteTransactionsVisible: PropTypes.bool,
	gasLimit: PropTypes.string,
	gasPrice: PropTypes.string,
	onCancelEditQuoteTransactions: PropTypes.func,
	onHandleGasFeeSelection: PropTypes.func,
	selectedQuote: PropTypes.object,
	sourceToken: PropTypes.object
};

TransactionsEditionModal.navigationOptions = ({ navigation }) => getSwapsQuotesNavbar(navigation);

const mapStateToProps = state => ({
	approvalTransaction: state.engine.backgroundState.SwapsController.approvalTransaction
});

export default connect(mapStateToProps)(TransactionsEditionModal);
