class Track {
    constructor(samplerate, waveform, attack, decay, sustain, release) {
        this.samplerate = samplerate;
        this.waveform = waveform;
        this.samples = new Int16Array(0);
        this.fundamental = 440;
        this.pan = 0;
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
    }
    generateTone(frequency, duration) {
        // TODO: respond to ADSR envelope
        var newsamples = new Int16Array(this.samples.length + (this.samplerate * (duration+this.release)));
        newsamples.set(this.samples);
        for (var i = this.samples.length; i < this.samples.length + (this.samplerate * (duration+this.release)); i++) {
            // calculate amplitude
            var amplitude;
            // attack
            if (i < (this.attack * this.samplerate)) {
                amplitude = (i / this.samplerate) * (1 / this.attack);
            }
            // decay
            if (i > (this.attack * this.samplerate) && i < (this.attack+this.decay * this.samplerate)) {
                amplitude = ((i - (this.attack * this.samplerate)) / this.samplerate) * -(1 - this.sustain / this.decay);
            }
            // sustain
            if (i > (this.attack+this.decay * this.samplerate) && i < duration*this.samplerate) {
                amplitude = this.sustain;
            }
            // release
            if (i > duration*this.samplerate) {
                amplitude = this.sustain - (((i - (this.attack * this.samplerate)) / this.samplerate) * (this.sustain / this.release));
            }
            newsamples[i] = this.waveform(i*2*Math.PI * (frequency/this.samplerate)) * amplitude * 0x7fff;
        }
        this.samples = newsamples;
    }
    generatePause(duration) {
        var newsamples = new Int16Array(this.samples.length + (this.samplerate * duration));
        newsamples.set(this.samples);
        this.samples = newsamples;
    }
    playNote(semitones, duration) {
        this.generateTone(this.fundamental * (2 ** (semitones / 12)), duration);
    }
}

var waveforms = {
    tri: function(x) {
        x = (x/Math.PI) % 2;
        if (x <= 0.5) {
            return 2*x;
        }
        if ((x > 0.5) && (x < 1.5)) {
            return (-2*x) + 2;
        }
        if (x >= 1.5) {
            return (2*x) - 4;
        }
    },
    sqr: function(x) {
        x = (x/Math.PI) % 2;
        if (x <= 1) {
            return 1;
        }
        if (x > 1) {
            return -1;
        }
    },
    saw: function(x) {
        return ((x/Math.PI) + 1) % 2 - 1;
    },
    sin: Math.sin
}

function mix(...tracks) {
    var longestTrackLength = 0;
    for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].samples.length > longestTrackLength) {
            longestTrackLength = tracks[i].samples.length;
        }
    }
    var mix = new Int16Array(longestTrackLength*2);
    for (var i = 0; i < tracks.length; i++) {
        var rightVol = 1;
        if (tracks[i].pan < 0) {
            rightVol = tracks[i].pan + 1;
        }
        var leftVol = 1;
        if (tracks[i].pan > 0) {
            leftVol = (-tracks[i].pan) + 1;
        }
        for (var j = 0; j < tracks[i].samples.length; j++) {
            mix[j*2] += tracks[i].samples[j] * leftVol;
            mix[j*2+1] += tracks[i].samples[j] * rightVol;
        }
    }
    return mix;
}

// create 2 tracks, a sawtooth panned slightly left, and a sine panned slightly right, sample rate 44.1khz

/*var track1 = new Track(44100, waveforms.saw, 0.01, 0.01, 0.3, 0.01);
track1.pan = -0.5;
var track2 = new Track(44100, waveforms.saw, 0.01, 0.01, 0.3, 0.01);
track2.pan = 0.5;
var track3 = new Track(44100, waveforms.saw, 0.01, 0.01, 0.3, 0.01);


track1.playNote(-9, 0.25);
track1.playNote(-7, 0.25);
track1.playNote(-5, 0.25);
track1.playNote(-4, 0.25);
track1.playNote(-2, 0.25);
track1.playNote(-4, 0.25);
track1.playNote(-5, 0.25);
track1.playNote(-7, 0.25);
track1.playNote(-9, 0.25);
track1.playNote(-5, 0.25);
track1.playNote(-2, 0.25);
track1.playNote(-5, 0.25);
track1.playNote(-9, 0.25);
track1.generatePause(0.25);
track1.playNote(-9, 0.25);
track1.generatePause(3);

track2.generatePause(3.5);
track2.playNote(-2, 0.25);
track2.generatePause(3);

track3.generatePause(3.5);
track3.playNote(3, 0.25);

// play lower notes on sawtooth

for (var i = 0; i < 4; i++) {
    track1.playNote(-36, 0.125);
    track1.playNote(-36, 0.125);
    track1.playNote(-33, 0.125);
    track1.playNote(-36, 0.125);
    track1.playNote(-38, 0.125);
    track1.playNote(-36, 0.125);
    track1.playNote(-26, 0.125);
    track1.playNote(-24, 0.125);
}

// play higher notes on sine

for (var i = 0; i < 4; i++) {
    track2.playNote(-24, 0.125);
    track2.playNote(-24, 0.125);
    track2.playNote(-21, 0.125);
    track2.playNote(-24, 0.125);
    track2.playNote(-26, 0.125);
    track2.playNote(-24, 0.125);
    track2.playNote(-14, 0.125);
    track2.playNote(-12, 0.125);
}

// mix the tracks and write the data to a file

require('fs').writeFileSync('track1.pcm', track1.samples);
require('fs').writeFileSync('track2.pcm', track2.samples);
require('fs').writeFileSync('track3.pcm', track3.samples);
require('fs').writeFileSync('mix.pcm', mix(track1, track2, track3));*/

var track = new Track(44100, waveforms.sin, 2, 2, 0.8, 2);
track.playNote(0, 10);
require('fs').writeFileSync('track1.pcm', track.samples);