const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { parseEther } = require('ethers/lib/utils');
const { ethers } = require('hardhat');

describe('Attack', function () {
	it('Should empty the balane of the good contract', async function () {
		// Deploy `GoodContract`
		const goodContractFactory = await ethers.getContractFactory('GoodContract');
		const goodContract = await goodContractFactory.deploy();
		await goodContract.deployed();

		// Deploy `BadContract`
		const badContractFactory = await ethers.getContractFactory('BadContract');
		const badContract = await badContractFactory.deploy(goodContract.address);
		await badContract.deployed();

		// Two addresses: user & an attacker
		const [_, userAddy, attackerAddy] = await ethers.getSigners();

		// User deposits 10 ETH into `GoodContract`
		let tx = await goodContract.connect(userAddy).addBalance({
			value: parseEther('10'),
		});

		await tx.wait();

		// Check that `GoodContract` currently has the 10 ETH
		let balanceETH = await ethers.provider.getBalance(goodContract.address);
		expect(balanceETH).to.equal(parseEther('10'));

		// Attacker calls `attack` on `BadContract`
		tx = await badContract.connect(attackerAddy).attack({
			value: parseEther('1'),
		});

		await tx.wait();

		// Balance of `GoodContract` should now be 0
		balanceETH = await ethers.provider.getBalance(goodContract.address);
		expect(balanceETH).to.equal(BigNumber.from('0'));

		// Balance of `BadContract` should now be 11 ETH (10 stolen, 1 from attacker)
		balanceETH = await ethers.provider.getBalance(badContract.address);
		expect(balanceETH).to.equal(parseEther('11'));
	});
});
