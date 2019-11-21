import { Player } from "../src/jasmine_examples/Player";
import { Song } from "../src/jasmine_examples/Song";

beforeEach(function () {
  jasmine.addMatchers({
    toBePlaying: function () {
      return {
        compare: function (actual: Player, expected: Song) {
          var player = actual;

          return {
            pass: player.currentlyPlayingSong === expected && player.isPlaying
          }
        }
      };
    }
  });
});
