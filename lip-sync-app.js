class LipSyncApp {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.currentPhoneme = '';
        this.phonemes = [];
        this.phonemeToVisemeMap = {
            'pp': 'bilabial', 'bb': 'bilabial', 'mm': 'bilabial',
            'tt': 'alveolar', 'dd': 'alveolar', 'nn': 'alveolar',
            'kk': 'velar', 'gg': 'velar', 'ng': 'velar',
            'ff': 'labiodental', 'vv': 'labiodental', 'th': 'interdental',
            'dh': 'interdental', 'ss': 'alveolar', 'zz': 'alveolar',
            'sh': 'postalveolar', 'zh': 'postalveolar', 'hh': 'glottal',
            'jj': 'palatal', 'ch': 'postalveolar', 'rr': 'alveolar',
            'll': 'alveolar', 'ww': 'bilabial', 'wh': 'bilabial',
            'yy': 'palatal',
            
            'ii': 'close_front_unrounded', 'ix': 'near_close_near_front_unrounded',
            'eh': 'close_mid_front_unrounded', 'ex': 'near_close_near_front_unrounded',
            'ax': 'open_front_unrounded', 'aa': 'open_back_rounded',
            'ox': 'open_back_rounded', 'oo': 'close_back_rounded',
            'ux': 'near_close_near_back_rounded', 'uu': 'close_back_rounded',
            
            'ay': 'diphthong_open_front_unrounded_to_close_front_unrounded',
            'aw': 'diphthong_open_front_unrounded_to_close_back_rounded',
            'oy': 'diphthong_open_back_rounded_to_close_front_unrounded',
            'iy': 'diphthong_close_front_unrounded_to_near_close_near_front_unrounded',
            'uw': 'diphthong_close_back_rounded_to_near_close_near_back_rounded'
        };

        this.init();
    }
    extractPhonemes(text) {
        const phonemeDictionary = {
            'a': ['ah', 'ae'], 'e': ['eh', 'ee'], 'i': ['ih', 'ie'],
            'o': ['oh', 'oe'], 'u': ['uh', 'oo'], 'y': ['ih', 'ie'],
            'ai': ['ay'], 'au': ['aw'], 'ei': ['ay'], 'oi': ['oy'],
            'ou': ['ow'], 'ea': ['eh', 'ee'], 'oa': ['oh', 'oe'],
            'ui': ['oo'], 'ue': ['oo']
        };
    
        // Convert to lowercase and remove punctuation
        text = text.toLowerCase().replace(/[^\w\s]/g, '');
    
        // Split into words
        const words = text.split(/\s+/);
    
        const phonemes = [];
    
        for (let word of words) {
            // Find vowel patterns
            const vowelPatterns = word.match(/(?:[aeiouy]{1,3}|(?:[aeiouy]{1,2}[bcdfghjklmnpqrstvwxyz]))/g);
    
            if (vowelPatterns) {
                for (let pattern of vowelPatterns) {
                    // Check for diphthongs and triphthongs
                    if (pattern.length === 2 && pattern[0] !== pattern[1]) {
                        const key = pattern.slice(0, 2);
                        if (key in phonemeDictionary) {
                            phonemes.push(...phonemeDictionary[key]);
                        } else {
                            phonemes.push(pattern[0], pattern[1]);
                        }
                    } else if (pattern.length === 3 && pattern[0] !== pattern[1] && pattern[1] !== pattern[2]) {
                        const key = pattern.slice(0, 2);
                        if (key in phonemeDictionary) {
                            phonemes.push(...phonemeDictionary[key]);
                        } else {
                            phonemes.push(pattern[0], pattern[1]);
                        }
                        phonemes.push(pattern[2]);
                    } else {
                        // Single vowel or consonant cluster
                        if (pattern[0] in phonemeDictionary) {
                            phonemes.push(...phonemeDictionary[pattern[0]]);
                        } else {
                            phonemes.push(pattern[0]);
                        }
                    }
                }
            }
        }
    
        return phonemes.filter((phoneme, index, self) =>
            index === self.findIndex(p => p === phoneme)
        );
    }
    updateViseme() {
        if (this.phonemes.length > 0) {
            const phoneme = this.phonemes[0].toLowerCase();
            this.currentViseme = this.phonemeToVisemeMap[phoneme] || 'neutral';
            this.phonemes.shift();
        } else {
            this.currentViseme = 'neutral';
        }
        this.drawFace();
    }
    init() {
        this.setupCanvas();
        this.setupAudio();
        this.addEventListeners();
    }
    animate() {
        requestAnimationFrame(() => {
            this.animate();
        });
    }
    addEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.animate();
            document.getElementById('startButton').disabled = true;
            document.getElementById('stopButton').disabled = false;
        });

        document.getElementById('stopButton').addEventListener('click', () => {
            window.cancelAnimationFrame(this.animationId);
            document.getElementById('startButton').disabled = false;
            document.getElementById('stopButton').disabled = true;
        });
    }

    setupCanvas() {
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.drawFace();
    }
    setupAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.audioContext.createMediaStreamSource(stream);
                this.analyser = this.audioContext.createAnalyser();
                source.connect(this.analyser);
                this.startSpeechRecognition();
            })
            .catch(error => console.error('Error accessing microphone:', error));
    }
    startSpeechRecognition() {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = true;
        recognition.lang = 'en-US';

        recognition.onresult = event => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            this.phonemes = this.extractPhonemes(transcript);
            this.updateViseme();
        };

        recognition.start();
    }
    drawFace() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 180, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawEyes();
        this.drawMouth(this.currentPhoneme);
    }

    drawEyes() {
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2 - 60, this.canvas.height / 2 - 80, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2 + 60, this.canvas.height / 2 - 80, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMouth(phoneme) {
        const viseme = this.phonemeToVisemeMap[phoneme] || 'neutral';
        switch (viseme) {
            case 'bilabial':
                this.drawBilabialMouth();
                break;
            case 'alveolar':
                this.drawAlveolarMouth();
                break;
            case 'velar':
                this.drawVelarMouth();
                break;
            case 'labiodental':
                this.drawLabiodentalMouth();
                break;
            case 'interdental':
                this.drawInterdentalMouth();
                break;
            case 'postalveolar':
                this.drawPostalveolarMouth();
                break;
            case 'glottal':
                this.drawGlottalMouth();
                break;
            case 'palatal':
                this.drawPalatalMouth();
                break;
            case 'close_front_unrounded':
                this.drawCloseFrontUnroundedMouth();
                break;
            // ... (add cases for other visemes)
            default:
                this.drawNeutralMouth();
                break;
        }
    }

    drawBilabialMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Add upper lip
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 40, this.canvas.height / 2 + 90);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 80, this.canvas.width / 2 + 40, this.canvas.height / 2 + 90);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawAlveolarMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFA07A'; // Orange color
        this.ctx.fill();
        
        // Add tongue position
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 95, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFF'; // White color
        this.ctx.fill();
    }

    drawVelarMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 110, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00FFFF'; // Cyan color
        this.ctx.fill();
        
        // Add soft palate shape
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 105);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 115, this.canvas.width / 2 + 30, this.canvas.height / 2 + 105);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawLabiodentalMouth() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 40, this.canvas.height / 2 + 100);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 120, this.canvas.width / 2 + 40, this.canvas.height / 2 + 100);
        this.ctx.strokeStyle = '#800080'; // Purple color
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Add lower teeth
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 35, this.canvas.height / 2 + 105);
        this.ctx.lineTo(this.canvas.width / 2 + 35, this.canvas.height / 2 + 105);
        this.ctx.strokeStyle = '#FFF'; // White color
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawInterdentalMouth() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 50, this.canvas.height / 2 + 90);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 110, this.canvas.width / 2 + 50, this.canvas.height / 2 + 90);
        this.ctx.strokeStyle = '#008000'; // Green color
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Add tongue between teeth
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 10, this.canvas.height / 2 + 95);
        this.ctx.lineTo(this.canvas.width / 2 + 10, this.canvas.height / 2 + 95);
        this.ctx.strokeStyle = '#FFF'; // White color
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawPostalveolarMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 35, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF69B4'; // Pink color
        this.ctx.fill();
        
        // Add retroflexion
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 105);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 115, this.canvas.width / 2 + 30, this.canvas.height / 2 + 105);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawGlottalMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 30, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF0000'; // Red color
        this.ctx.fill();
        
        // Add epiglottis
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 20, this.canvas.height / 2 + 85);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 75, this.canvas.width / 2 + 20, this.canvas.height / 2 + 85);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawPalatalMouth() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 100);
        this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 120, this.canvas.width / 2 + 30, this.canvas.height / 2 + 100);
        this.ctx.strokeStyle = '#000080'; // Navy blue color
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Add palatal contact
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 95, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFF'; // White color
        this.ctx.fill();
    }

    drawCloseFrontUnroundedMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 80, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFF00'; // Yellow color
        this.ctx.fill();
        
        // Add tongue position
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 85, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFF'; // White color
        this.ctx.fill();
    }
    drawNeutralMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI);
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
    }


}

const app = new LipSyncApp('faceCanvas');