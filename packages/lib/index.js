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
        this.parseFootball(buffer);
        break;
      case 0x70:
        this.sport = 'volleyball';
        this.parseVolleyball(buffer);
        break;
      case 0x71:
        this.sport = 'baseball';
        this.parseBaseball(buffer);
        break;
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
  parseBaseball(buffer) {
    if (!this.sportInitialized) {
      this.time = {};

      this.home = {};

      this.guest = {};
      this.bases = {};
      this.innings = {
        1: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        2: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        3: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        4: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        5: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        6: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        7: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        8: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        9: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },

        10: {
          home: {
            score: 0,
          },
          guest: {
            score: 0,
          },
        },
      };
      this.sportInitialized = true;
    }

    const bufferHex = buffer.toString('hex');

    this.time.minutes = buffer.subarray(5, 6).toString('hex');
    this.time.seconds = buffer.subarray(6, 7).toString('hex');
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

      this.guest.hits = parseInt(buffer.subarray(23, 24).toString('hex'), 10);
      this.home.hits = parseInt(buffer.subarray(22, 23).toString('hex'), 10);

      this.batter = buffer.subarray(21, 22).toString('hex');
      if (this.batter === 'aa') {
        this.batter = '';
      }
      this.home.pitcher = parseInt(buffer.subarray(26, 27).toString('hex'), 10);
      this.guest.pitcher = parseInt(buffer.subarray(24, 25).toString('hex'), 10);
      const baseBinaryInfo = buffer.at(19).toString(2).padStart(8, '0');

      this.bases.first = baseBinaryInfo[3] === '1';
      this.bases.second = baseBinaryInfo[2] === '1';
      this.bases.third = baseBinaryInfo[1] === '1';

      this.outs = parseInt(bufferHex.substring(37, 38), 10);
      this.strikes = parseInt(bufferHex.substring(36, 37), 10);
      this.balls = parseInt(bufferHex.substring(39, 40), 10);
      const binaryFlags = buffer.at(12).toString(2).padStart(8, '0');
      this.hit = binaryFlags[4] === '1';
    } else if (seqNum === '22') {
      const guestInningStartIndex = 11;
      const homeInningStartIndex = 21;

      for (let i = 0; i < 10; i += 1) {
        const guestInningScore = buffer
          .subarray(guestInningStartIndex + i, guestInningStartIndex + i + 1)
          .toString('hex');
        if (guestInningScore !== '0a') {
          this.innings[i + 1].guest.score = parseInt(guestInningScore, 10);
        }
        const homeInningScore = buffer.subarray(homeInningStartIndex + i, homeInningStartIndex + i + 1).toString('hex');
        if (homeInningScore !== '0a') {
          this.innings[i + 1].home.score = parseInt(homeInningScore, 10);
        }
      }
    }
  }

  /**
   *
   * @param {Buffer} buffer
   */
  parseFootball(buffer) {
    if (!this.sportInitialized) {
      this.time = {};

      this.playClock = {};

      this.home = {};

      this.guest = {};
      this.sportInitialized = true;
    }

    const bufferHex = buffer.toString('hex');

    this.time.minutes = buffer.subarray(5, 6).toString('hex');
    this.time.seconds = buffer.subarray(6, 7).toString('hex');
    this.time.tenths = bufferHex.substring(15, 16);

    this.time.showTenths = bufferHex.at(8) === '1';
    this.time.display = `${this.time.minutes}:${this.time.seconds}`;

    this.playClock.seconds = bufferHex.substring(16, 18);

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

      this.home.timeouts = parseInt(bufferHex.substring(40, 41), 10);
      this.guest.timeouts = parseInt(bufferHex.substring(41, 42), 10);

      this.quarter = parseInt(bufferHex.substring(31, 32), 10);
      this.down = parseInt(bufferHex.substring(39, 40), 10);
      this.yardsToGo = parseInt(buffer.subarray(18, 19).toString('hex'), 10);
      this.ballOn = parseInt(buffer.subarray(21, 22).toString('hex'), 10);
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

      this.home.timeouts = parseInt(bufferHex.substring(40, 41), 10);
      this.guest.timeouts = parseInt(bufferHex.substring(41, 42), 10);

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

      this.shotClock = {};

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

    this.shotClock.seconds = bufferHex.substring(16, 18);
    if (this.shotClock.seconds === 'aa') {
      this.shotClock.seconds = '00';
    }

    this.shotClock.tenths = bufferHex.substring(19, 20);
    if (this.shotClock.tenths === 'a') {
      this.shotClock.tenths = '0';
    }

    this.shotClock.display = `${this.shotClock.seconds}.${this.shotClock.tenths}`;

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
