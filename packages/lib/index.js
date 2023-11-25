/* eslint-disable no-bitwise */
const _ = require('lodash');

class Console {
  constructor() {
    this.sportInitialized = false;
    this.state = {
      time: {},
      home: {},
      guest: {},
    };
  }

  reset() {
    this.sportInitialized = false;
    delete this.sport;
    this.propertiesToDelete = [];
    this.state = {
      time: {},
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
      this.latestPacket = {
        hex: buffer.toString('hex'),
        buffer,
      };
      this.parseCommon();
      switch (this.latestPacket.buffer.at(2)) {
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
          this.parseSoccer();
          break;
        case 0x60:
          this.sport = 'wrestling';
          this.parseWrestling();
          break;
        case 0x40:
          this.sport = 'hockey';
          this.parseHockey();
          break;
        case 0x85:
          this.sport = 'auto_racing';
          this.parseAutoRacing();
          break;
        case 0x82:
          this.sport = 'track';
          this.parseTrack();
          break;
        case 0x59:
          this.sport = 'whirley';
          this.parseWhirley();
          break;
        case 0x67:
          this.sport = 'segment';
          throw new Error('Segment is not implemented');
        default:
          console.log(`unidentified sport data: ${buffer.toString('hex')}`);
          break;
      }
      if (this.propertiesToDelete) {
        this.state = _.omit(this.state, this.propertiesToDelete);
      }
    }
  }

  parseCommon() {
    this.state.time.minutes = this.latestPacket.buffer.subarray(5, 6).toString('hex');
    this.state.time.seconds = this.latestPacket.buffer.subarray(6, 7).toString('hex');
    this.state.time.tenths = this.latestPacket.hex.substring(15, 16);

    this.state.time.showTenths = (this.latestPacket.buffer.at(4) & 16) !== 0;
    this.state.time.display = `${this.state.time.minutes}:${this.state.time.seconds}`;

    if (this.state.time.showTenths) {
      this.state.time.display += `.${this.state.time.tenths}`;
    }

    this.state.auxTime = this.latestPacket.buffer.subarray(8, 9).toString('hex');
    if (this.state.auxTime === 'aa') {
      this.state.auxTime = '';
    }
    this.state.aux2Time = this.latestPacket.buffer.subarray(9, 10).toString('hex');
    if (this.state.aux2Time === 'aa') {
      this.state.aux2Time = '';
    }

    const hornBinaryFlags = this.latestPacket.buffer.at(4).toString(2).padStart(8, '0');
    this.state.horn = hornBinaryFlags[0] === '1';
    this.state.auxHorn = hornBinaryFlags[1] === '1';

    this.state.showTimeOfDay = this.latestPacket.buffer.at(5) === 0xff && this.latestPacket.buffer.at(6) === 0xff;

    if (this.latestPacket.buffer.at(10) === 0x11) {
      this.state.period = parseInt(this.latestPacket.hex.substring(31, 32), 10);

      if (this.state.home && this.state.guest) {
        const homeBinaryInfo = this.latestPacket.buffer.at(12).toString(2).padStart(8, '0');
        const guestBinaryInfo = this.latestPacket.buffer.at(14).toString(2).padStart(8, '0');

        this.state.home.score = this.getInt(this.latestPacket.buffer.at(11));
        if (homeBinaryInfo[0] === '1') {
          this.state.home.score += 100;
        }
        this.state.guest.score = this.getInt(this.latestPacket.buffer.at(13));
        if (guestBinaryInfo[0] === '1') {
          this.state.guest.score += 100;
        }

        this.state.home.poss = homeBinaryInfo[7] === '1';
        this.state.guest.poss = guestBinaryInfo[7] === '1';

        this.state.home.doubleBonus = homeBinaryInfo[3] === '1';
        this.state.home.bonus = homeBinaryInfo[4] === '1';

        this.state.guest.doubleBonus = guestBinaryInfo[3] === '1';
        this.state.guest.bonus = guestBinaryInfo[4] === '1';

        this.state.home.timeouts = this.latestPacket.buffer.at(20) >> 4;
        this.state.guest.timeouts = this.latestPacket.buffer.at(20) & 15;
      }
    }
  }

  parseBaseball() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'home.poss',
        'guest.poss',
        'home.timeouts',
        'guest.timeouts',
        'auxTime',
        'aux2Time',
        'period',
        'auxHorn',
      ];

      this.state.bases = {
        first: false,
        second: false,
        third: false,
      };

      this.sportInitialized = true;
    }

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.inning = this.state.period;

      this.state.guest.hits = parseInt(this.latestPacket.buffer.subarray(23, 24).toString('hex'), 10);
      this.state.home.hits = parseInt(this.latestPacket.buffer.subarray(22, 23).toString('hex'), 10);

      this.state.batter = this.latestPacket.buffer.subarray(21, 22).toString('hex');
      if (this.state.batter === 'aa') {
        this.state.batter = '';
      }
      this.state.home.pitcher = parseInt(this.latestPacket.buffer.subarray(26, 27).toString('hex'), 10);
      this.state.guest.pitcher = parseInt(this.latestPacket.buffer.subarray(24, 25).toString('hex'), 10);
      const baseBinaryInfo = this.latestPacket.buffer.at(19).toString(2).padStart(8, '0');

      this.state.bases.first = baseBinaryInfo[3] === '1';
      this.state.bases.second = baseBinaryInfo[2] === '1';
      this.state.bases.third = baseBinaryInfo[1] === '1';

      this.state.outs = parseInt(this.latestPacket.hex.substring(37, 38), 10);
      this.state.strikes = parseInt(this.latestPacket.hex.substring(36, 37), 10);
      this.state.balls = parseInt(this.latestPacket.hex.substring(39, 40), 10);
      const binaryFlags = this.latestPacket.buffer.at(12).toString(2).padStart(8, '0');
      this.state.hit = binaryFlags[4] === '1';
    } else if (seqNum === 0x22) {
      this.state.innings = [];
      const guestInningStartIndex = 11;
      const homeInningStartIndex = 21;

      for (let i = 0; i < 10; i += 1) {
        const inning = {
          inningNum: i + 1,
          home: {},
          guest: {},
        };
        const guestInningScore = this.latestPacket.buffer
          .subarray(guestInningStartIndex + i, guestInningStartIndex + i + 1)
          .toString('hex');
        if (guestInningScore !== '0a') {
          inning.guest.score = parseInt(guestInningScore, 10);
        }
        const homeInningScore = this.latestPacket.buffer
          .subarray(homeInningStartIndex + i, homeInningStartIndex + i + 1)
          .toString('hex');
        if (homeInningScore !== '0a') {
          inning.home.score = parseInt(homeInningScore, 10);
        }
        this.state.innings.push(inning);
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
      this.propertiesToDelete = [
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'auxTime',
        'aux2Time',
        'period',
        'auxHorn',
      ];
    }

    this.state.playClock = this.state.auxTime;

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.quarter = this.state.period;
      this.state.down = parseInt(this.latestPacket.hex.substring(39, 40), 10);
      this.state.yardsToGo = this.getInt(this.latestPacket.buffer.at(18));
      this.state.ballOn = this.getInt(this.latestPacket.buffer.at(21));
    }
  }

  parseVolleyball() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'auxTime',
        'aux2Time',
      ];
      this.sportInitialized = true;
    }
    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.gamesWon = parseInt(this.latestPacket.hex.substring(32, 34), 10);
      this.state.guest.gamesWon = parseInt(this.latestPacket.hex.substring(34, 36), 10);
    }
  }

  parseBasketball() {
    if (!this.sportInitialized) {
      this.sportInitialized = true;
      this.propertiesToDelete = ['home.doubleBonus', 'guest.doubleBonus', 'auxTime', 'aux2Time'];
    }

    this.state.shotClock = {
      seconds: this.state.auxTime,
      tenths: this.state.aux2Time === '0a' ? '0' : parseInt(this.state.aux2Time, 10).toString(),
    };

    this.state.shotClock.display = `${this.state.shotClock.seconds}`;

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.fouls = parseInt(this.latestPacket.hex.substring(32, 34), 10);
      this.state.guest.fouls = parseInt(this.latestPacket.hex.substring(34, 36), 10);
      this.state.playerNum = parseInt(this.latestPacket.hex.substring(36, 38), 10);
      this.state.playerFoul = parseInt(this.latestPacket.hex.substring(39, 40), 10);
    }

    // TODO(jwetzell): decode player stats in seqNum >= 22
  }

  parseWrestling() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.doubleBonus',
        'guest.doubleBonus',
        'home.poss',
        'guest.poss',
        'auxTime',
        'aux2Time',
      ];
      this.sportInitialized = true;
    }

    this.state.advantage = {
      minutes: this.state.aux2Time,
      seconds: this.state.auxTime,
    };

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.advantage = this.state.home.poss;
      this.state.guest.advantage = this.state.guest.poss;

      this.state.home.boutScore = this.getInt(this.latestPacket.buffer.at(16));
      this.state.guest.boutScore = this.getInt(this.latestPacket.buffer.at(17));
      this.state.weight =
        this.getInt(this.latestPacket.buffer.at(18)) + this.getInt(this.latestPacket.buffer.at(19)) * 100;
    }
  }

  parseAutoRacing() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = ['home', 'guest', 'auxTime', 'aux2Time', 'auxHorn', 'period'];
      this.sportInitialized = true;
    }
    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.lap =
        this.getInt(this.latestPacket.buffer.at(19)) * 100 + this.getInt(this.latestPacket.buffer.at(20));
      this.state.positions = [];
      for (let i = 0; i < 10; i += 1) {
        const positionByte = this.latestPacket.buffer.at(21 + i);
        if (positionByte !== 0xaa) {
          this.state.positions.push(this.getInt(positionByte));
        }
      }
    }
  }

  parseSoccer() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'auxTime',
        'aux2Time',
        'auxHorn',
        'period',
      ];
      this.sportInitialized = true;
    }

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.half = this.period;
      this.state.home.shotsOnGoal = this.getInt(this.latestPacket.buffer.at(16));
      this.state.guest.shotsOnGoal = this.getInt(this.latestPacket.buffer.at(17));
      this.state.home.cornerKicks = this.getInt(this.latestPacket.buffer.at(21));
      this.state.guest.cornerKicks = this.getInt(this.latestPacket.buffer.at(22));
    }
  }

  parseHockey() {
    if (!this.sportInitialized) {
      this.sportInitialized = true;
    }

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.home.shotsOnGoal = this.getInt(this.latestPacket.buffer.at(16));
      this.state.guest.shotsOnGoal = this.getInt(this.latestPacket.buffer.at(17));
      this.state.home.saves = this.getInt(this.latestPacket.buffer.at(21));
      this.state.guest.saves = this.getInt(this.latestPacket.buffer.at(22));
    }
    if (seqNum === 0x22) {
      this.state.home.penalties = [];
      this.state.guest.penalties = [];
      for (let i = 0; i < 2; i += 1) {
        const startIndex = 11 + i * 3;
        if (this.latestPacket.buffer.at(startIndex) !== 0xaa) {
          const penaltyClock = {
            minutes: this.latestPacket.buffer.subarray(startIndex, startIndex + 1).toString('hex'),
            seconds: this.latestPacket.buffer.subarray(startIndex + 1, startIndex + 2).toString('hex'),
          };

          penaltyClock.display = `${penaltyClock.minutes}:${penaltyClock.seconds}`;

          this.state.home.penalties.push({
            clock: penaltyClock,
            playerNum: this.getInt(this.latestPacket.buffer.at(startIndex + 2)),
          });
        }
      }

      for (let i = 0; i < 2; i += 1) {
        const startIndex = 17 + i * 3;
        if (this.latestPacket.buffer.at(startIndex) !== 0xaa) {
          const penaltyClock = {
            minutes: this.latestPacket.buffer.subarray(startIndex, startIndex + 1).toString('hex'),
            seconds: this.latestPacket.buffer.subarray(startIndex + 1, startIndex + 2).toString('hex'),
          };

          penaltyClock.display = `${penaltyClock.minutes}:${penaltyClock.seconds}`;

          this.state.guest.penalties.push({
            clock: penaltyClock,
            playerNum: this.getInt(this.latestPacket.buffer.at(startIndex + 2)),
          });
        }
      }
    }
  }

  parseTrack() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.timeouts',
        'guest.timeouts',
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'auxTime',
        'aux2Time',
        'period',
        'auxHorn',
      ];
      this.sportInitialized = true;
    }

    const seqNum = this.latestPacket.buffer.at(10);
    if (seqNum === 0x11) {
      this.state.place = this.latestPacket.buffer.at(18);
      this.state.heat = this.latestPacket.buffer.at(15) & 15;
      this.state.lane = this.latestPacket.buffer.at(19);
      this.state.event = this.getInt(this.latestPacket.buffer.at(21));

      this.state.teamScores = [];
      this.state.teamScores.push(this.state.home.score);
      this.state.teamScores.push(this.state.guest.score);

      this.state.teamScores.push(this.getInt(this.latestPacket.buffer.at(16)));
      this.state.teamScores.push(this.getInt(this.latestPacket.buffer.at(17)));
      this.state.teamScores.push(this.getInt(this.latestPacket.buffer.at(22)));
      this.state.teamScores.push(this.getInt(this.latestPacket.buffer.at(23)));
    }
  }

  parseWhirley() {
    if (!this.sportInitialized) {
      this.propertiesToDelete = [
        'home.timeouts',
        'guest.timeouts',
        'home.bonus',
        'guest.bonus',
        'home.doubleBonus',
        'guest.doubleBonus',
        'auxTime',
        'aux2Time',
      ];
      this.sportInitialized = true;
    }

    this.state.key = this.state.aux2Time;
  }

  /**
   *
   * @param {number} packedNumber
   */
  getInt(packedNumber) {
    let originalValue = packedNumber;
    let num = ((originalValue >> 4) & 15) * 10;
    if (num > 90) {
      num = 0;
    }
    if ((originalValue & 15) > 9) {
      originalValue = 0x00;
    }
    return num + (originalValue & 15);
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
    START_LIVE: Buffer.from([...[0xfb, 0xb1, 0, 0, 0, 0, 0x54], ...[0xfb, 0xc1, 0, 0, 0, 0, 0x44]]),
    STOP_LIVE: Buffer.from([...[0xfb, 0xb0, 0, 0, 0, 0, 0x55], ...[0xfb, 0xc0, 0, 0, 0, 0, 0x45]]),
  },
};
