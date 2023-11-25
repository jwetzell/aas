class Console {
  constructor() {
    this.sportInitialized = false;
    this.state = {
      time: {},
      auxTime: {},
      home: {},
      guest: {},
    };
  }

  reset() {
    this.sportInitialized = false;
    delete this.sport;
    this.state = {
      time: {},
      auxTime: {},
      home: {},
      guest: {},
    };
  }

  /**
   *
   * @param {Buffer} buffer
   */
  update(buffer) {
    if (buffer.at(0) === 0xfc && buffer.at(1) === 0xfc) {
      this.currentBuffer = {
        hex: buffer.toString('hex'),
        buffer,
      };
      this.parseCommon();
      switch (this.currentBuffer.buffer.at(2)) {
        case 0x51:
          this.sport = 'basketball';
          this.parseBasketball();
          break;
        case 0x61:
          this.sport = 'football';
          this.parseFootball();
          break;
        case 0x70:
          this.sport = 'volleyball';
          this.parseVolleyball();
          break;
        case 0x71:
          this.sport = 'baseball';
          this.parseBaseball();
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
        case 0x85:
          this.sport = 'auto_racing';
          throw new Error('Auto racing is not implemented');
        case 0x82:
          this.sport = 'track';
          throw new Error('Track is not implemented');
        case 0x59:
          this.sport = 'whirley';
          throw new Error('Whirley is not implemented');
        case 0x67:
          this.sport = 'segment';
          throw new Error('Segment is not implemented');
        default:
          console.log(`unidentified sport data: ${buffer.toString('hex')}`);
          break;
      }
    }
  }

  parseCommon() {
    this.state.time.minutes = this.currentBuffer.buffer.subarray(5, 6).toString('hex');
    this.state.time.seconds = this.currentBuffer.buffer.subarray(6, 7).toString('hex');
    this.state.time.tenths = this.currentBuffer.hex.substring(15, 16);

    this.state.time.showTenths = this.currentBuffer.hex.at(8) === '1';
    this.state.time.display = `${this.state.time.minutes}:${this.state.time.seconds}`;

    if (this.state.time.showTenths) {
      this.state.time.display += `.${this.state.time.tenths}`;
    }

    this.state.auxTime.seconds = this.currentBuffer.hex.substring(16, 18);
    if (this.state.auxTime.seconds === 'aa') {
      this.state.auxTime.seconds = '00';
    }

    this.state.auxTime.tenths = this.currentBuffer.hex.substring(19, 20);
    if (this.state.auxTime.tenths === 'a') {
      this.state.auxTime.tenths = '0';
    }

    this.state.auxTime.display = `${this.state.auxTime.seconds}.${this.state.auxTime.tenths}`;

    const hornBinaryFlags = this.currentBuffer.buffer.at(4).toString(2).padStart(8, '0');
    this.state.horn = hornBinaryFlags[0] === '1';
    this.state.auxHorn = hornBinaryFlags[1] === '1';

    this.state.showTimeOfDay = this.currentBuffer.buffer.at(5) === 0xff && this.currentBuffer.buffer.at(6) === 0xff;

    if (this.currentBuffer.buffer.at(10) === 0x11) {
      const homeBinaryInfo = this.currentBuffer.buffer.at(12).toString(2).padStart(8, '0');
      const guestBinaryInfo = this.currentBuffer.buffer.at(14).toString(2).padStart(8, '0');

      this.state.home.score = parseInt(this.currentBuffer.hex.substring(22, 24), 10);
      if (homeBinaryInfo[0] === '1') {
        this.state.home.score += 100;
      }
      this.state.guest.score = parseInt(this.currentBuffer.hex.substring(26, 28), 10);
      if (guestBinaryInfo[0] === '1') {
        this.state.guest.score += 100;
      }

      this.state.home.poss = homeBinaryInfo[7] === '1';
      this.state.guest.poss = guestBinaryInfo[7] === '1';

      this.state.home.doubleBonus = homeBinaryInfo[3] === '1';
      this.state.home.bonus = homeBinaryInfo[4] === '1';

      this.state.guest.doubleBonus = guestBinaryInfo[3] === '1';
      this.state.guest.bonus = guestBinaryInfo[4] === '1';
      this.state.period = parseInt(this.currentBuffer.hex.substring(31, 32), 10);

      this.state.home.timeouts = parseInt(this.currentBuffer.hex.substring(40, 41), 10);
      this.state.guest.timeouts = parseInt(this.currentBuffer.hex.substring(41, 42), 10);
    }
  }

  parseBaseball() {
    if (!this.sportInitialized) {
      this.state.bases = {
        first: false,
        second: false,
        third: false,
      };

      this.state.innings = {
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

    const seqNum = this.currentBuffer.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.guest.hits = parseInt(this.currentBuffer.buffer.subarray(23, 24).toString('hex'), 10);
      this.state.home.hits = parseInt(this.currentBuffer.buffer.subarray(22, 23).toString('hex'), 10);

      this.state.batter = this.currentBuffer.buffer.subarray(21, 22).toString('hex');
      if (this.state.batter === 'aa') {
        this.state.batter = '';
      }
      this.state.home.pitcher = parseInt(this.currentBuffer.buffer.subarray(26, 27).toString('hex'), 10);
      this.state.guest.pitcher = parseInt(this.currentBuffer.buffer.subarray(24, 25).toString('hex'), 10);
      const baseBinaryInfo = this.currentBuffer.buffer.at(19).toString(2).padStart(8, '0');

      this.state.bases.first = baseBinaryInfo[3] === '1';
      this.state.bases.second = baseBinaryInfo[2] === '1';
      this.state.bases.third = baseBinaryInfo[1] === '1';

      this.state.outs = parseInt(this.currentBuffer.hex.substring(37, 38), 10);
      this.state.strikes = parseInt(this.currentBuffer.hex.substring(36, 37), 10);
      this.state.balls = parseInt(this.currentBuffer.hex.substring(39, 40), 10);
      const binaryFlags = this.currentBuffer.buffer.at(12).toString(2).padStart(8, '0');
      this.state.hit = binaryFlags[4] === '1';
    } else if (seqNum === 0x22) {
      const guestInningStartIndex = 11;
      const homeInningStartIndex = 21;

      for (let i = 0; i < 10; i += 1) {
        const guestInningScore = this.currentBuffer.buffer
          .subarray(guestInningStartIndex + i, guestInningStartIndex + i + 1)
          .toString('hex');
        if (guestInningScore !== '0a') {
          this.state.innings[i + 1].guest.score = parseInt(guestInningScore, 10);
        }
        const homeInningScore = this.currentBuffer.buffer
          .subarray(homeInningStartIndex + i, homeInningStartIndex + i + 1)
          .toString('hex');
        if (homeInningScore !== '0a') {
          this.state.innings[i + 1].home.score = parseInt(homeInningScore, 10);
        }
      }
    }
  }

  /**
   *
   * @param {Buffer} buffer
   */
  parseFootball() {
    if (!this.sportInitialized) {
      this.sportInitialized = true;
    }

    const seqNum = this.currentBuffer.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.quarter = parseInt(this.currentBuffer.hex.substring(31, 32), 10);
      this.state.down = parseInt(this.currentBuffer.hex.substring(39, 40), 10);
      this.state.yardsToGo = parseInt(this.currentBuffer.buffer.subarray(18, 19).toString('hex'), 10);
      this.state.ballOn = parseInt(this.currentBuffer.buffer.subarray(21, 22).toString('hex'), 10);
    }
  }

  parseVolleyball() {
    if (!this.sportInitialized) {
      this.sportInitialized = true;
    }
    const seqNum = this.currentBuffer.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.gamesWon = parseInt(this.currentBuffer.hex.substring(32, 34), 10);
      this.state.guest.gamesWon = parseInt(this.currentBuffer.hex.substring(34, 36), 10);
    }
  }

  parseBasketball() {
    if (!this.sportInitialized) {
      this.sportInitialized = true;
    }

    const seqNum = this.currentBuffer.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.fouls = parseInt(this.currentBuffer.hex.substring(32, 34), 10);
      this.state.guest.fouls = parseInt(this.currentBuffer.hex.substring(34, 36), 10);
      this.state.playerNum = parseInt(this.currentBuffer.hex.substring(36, 38), 10);
      this.state.playerFoul = parseInt(this.currentBuffer.hex.substring(39, 40), 10);
    }

    // TODO(jwetzell): decode player stats in seqNum >= 22
  }

  toJSON() {
    return {
      sport: this.sport,
      ...this.state,
    };
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
