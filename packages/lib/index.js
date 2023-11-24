class Console {
  constructor() {
    this.sportInitialized = false;
  }

  /**
   *
   * @param {Buffer} buffer
   */
  update(buffer) {
    switch (buffer.at(2)) {
      case 0x51:
        this.sport = 'basketball';
        this.parseBasketball(buffer);
        break;
      case 0x61:
        this.sport = 'football';
        throw new Error('Football is not implemented');
      case 0x70:
        this.sport = 'volleyball';
        this.parseVolleyball(buffer);
        break;
      case 0x71:
        this.sport = 'baseball';
        throw new Error('Baseball is not implemented');
      case 0x16:
        this.sport = 'soccer';
        throw new Error('Soccer is not implemented');
      case 0x60:
        this.sport = 'wrestling';
        throw new Error('Wrestling is not implemented');
      case 0x40:
        this.sport = 'hockey';
        throw new Error('Hockey is not implemented');
      default:
        console.log(`unidentified sport data: ${buffer.toString('hex')}`);
        break;
    }
  }

  /**
   *
   * @param {Buffer} buffer
   */
  parseVolleyball(buffer) {
    const bufferHex = buffer.toString('hex');
    if (!this.sportInitialized) {
      this.time = {};

      this.home = {};

      this.guest = {};
      this.sportInitialized = true;
    }

    this.time.minutes = bufferHex.substring(10, 12);
    this.time.seconds = bufferHex.substring(12, 14);
    this.time.tenths = bufferHex.substring(15, 16);

    this.time.showTenths = bufferHex.at(8) === '1';
    this.time.display = `${this.time.minutes}:${this.time.seconds}`;

    const seqNum = bufferHex.substring(20, 22);
    if (seqNum === '11') {
      const homeBinaryInfo = buffer.at(12).toString(2).padStart(8, '0');
      const guestBinaryInfo = buffer.at(14).toString(2).padStart(8, '0');

      this.home.score = parseInt(bufferHex.substring(22, 24), 10);
      if (homeBinaryInfo[0] === '1') {
        this.home.score += 100;
      }
      this.guest.score = parseInt(bufferHex.substring(26, 28), 10);
      if (guestBinaryInfo[0] === '1') {
        this.guest.score += 100;
      }

      this.home.serve = homeBinaryInfo[7] === '1';
      this.guest.serve = guestBinaryInfo[7] === '1';

      this.home.gamesWon = parseInt(buffer.subarray(16, 17).toString('hex'), 10);
      this.guest.gamesWon = parseInt(buffer.subarray(17, 18).toString('hex'), 10);
      this.game = parseInt(bufferHex.substring(31, 32), 10);
    }
  }

  /**
   *
   * @param {Buffer} buffer
   */
  parseBasketball(buffer) {
    const bufferHex = buffer.toString('hex');
    if (!this.sportInitialized) {
      this.time = {};

      this.shotclock = {};

      this.home = {};

      this.guest = {};
      this.sportInitialized = true;
    }

    this.time.minutes = bufferHex.substring(10, 12);
    this.time.seconds = bufferHex.substring(12, 14);
    this.time.tenths = bufferHex.substring(15, 16);

    this.time.showTenths = bufferHex.at(8) === '1';
    this.time.display = `${this.time.minutes}:${this.time.seconds}`;

    if (this.time.showTenths) {
      this.time.display += `.${this.time.tenths}`;
    }

    this.shotclock.seconds = bufferHex.substring(16, 18);
    if (this.shotclock.seconds === 'aa') {
      this.shotclock.seconds = '00';
    }

    this.shotclock.tenths = bufferHex.substring(19, 20);
    if (this.shotclock.tenths === 'a') {
      this.shotclock.tenths = '0';
    }

    this.shotclock.display = `${this.shotclock.seconds}.${this.shotclock.tenths}`;

    const seqNum = bufferHex.substring(20, 22);
    if (seqNum === '11') {
      const homeBinaryInfo = buffer.at(12).toString(2).padStart(8, '0');
      const guestBinaryInfo = buffer.at(14).toString(2).padStart(8, '0');

      this.home.score = parseInt(bufferHex.substring(22, 24), 10);
      if (homeBinaryInfo[0] === '1') {
        this.home.score += 100;
      }
      this.guest.score = parseInt(bufferHex.substring(26, 28), 10);
      if (guestBinaryInfo[0] === '1') {
        this.guest.score += 100;
      }

      this.home.poss = homeBinaryInfo[7] === '1';
      this.guest.poss = guestBinaryInfo[7] === '1';

      this.home.doubleBonus = homeBinaryInfo[3] === '1';
      this.home.bonus = homeBinaryInfo[4] === '1';

      this.guest.doubleBonus = guestBinaryInfo[3] === '1';
      this.guest.bonus = guestBinaryInfo[4] === '1';

      this.home.fouls = parseInt(bufferHex.substring(32, 34), 10);
      this.guest.fouls = parseInt(bufferHex.substring(34, 36), 10);

      this.home.timeouts = parseInt(bufferHex.substring(40, 41), 10);
      this.guest.timeouts = parseInt(bufferHex.substring(41, 42), 10);

      this.period = parseInt(bufferHex.substring(31, 32), 10);
    }
  }
}

module.exports = {
  Console,
  Packets: {
    START_LIVE: Buffer.from([
      ...[0xfb, 0xb1, 0, 0, 0, 0, 0x54],
      ...[0xfb, 0xc1, 0, 0, 0, 0, 0x44],
      ...[0xfb, 0xb1, 0, 0, 0, 0, 0x54],
    ]),
    STOP_LIVE: Buffer.from([...[0xfb, 0xc0, 0, 0, 0, 0, 0x45], ...[0xfb, 0xb0, 0, 0, 0, 0, 0x55]]),
  },
};
