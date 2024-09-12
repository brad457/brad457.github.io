class LipSyncApp {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.phonemes = ['a', 'e', 'i', 'o', 'u'];
        this.phoneme = '';
        this.phonemeIndex = 0;
        this.currentMouthState = { x: 0, y: 0 };
        this.targetMouthState = { x: 0, y: 0 };
        this.transitionDuration = 200; // ms
        this.transitionProgress = 0;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.mediaSource = null;
        this.isSpeaking = false;
        this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.speechSynthesis = window.speechSynthesis;
        this.textBuffer = '';

        this.setupAudio();
        this.setupSpeechRecognition();

        this.addEventListeners();
    }

    setupAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaStream = stream;
                this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
                this.source.connect(this.analyser);
                this.analyser.fftSize = 256;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArr = new Uint8Array(this.bufferLength);

                this.analyser.addEventListener('webkitspeechreCOGNITIONRESULT', () => {
                    this.isSpeaking = true;
                });

                this.analyser.addEventListener('webkitspeechrecognitionerror', () => {
                    this.isSpeaking = false;
                });

                this.analyser.addEventListener('webkitspeechrecognitionend', () => {
                    this.isSpeaking = false;
                });
            })
            .catch(err => console.error('Error accessing microphone:', err));
    }

    setupSpeechRecognition() {
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.speechRecognition.onresult = (event) => {
            const text = event.results[event.resultIndex][0].transcript;
            this.textBuffer += text;
            this.processText(text);
        };

        this.speechRecognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);
        };

        this.speechRecognition.onend = () => {
            console.log('Speech recognition ended');
        };
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (x > 0 && x < this.canvas.width && y > 0 && y < this.canvas.height) {
                this.changePhoneme(this.phonemes[Math.floor(Math.random() * this.phonemes.length)]);
            }
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    processText(text) {
        if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.speechSynthesis.cancel();

            let utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.volume = 1.0;
            utterance.onend = () => {
                this.isSpeaking = false;
            };

            this.speechSynthesis.speak(utterance);
        }
    }

    drawBackground() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFace() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 150, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 130, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    drawEyes() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2 - 50, this.canvas.height / 2 - 75, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2 + 50, this.canvas.height / 2 - 75, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();
    }

    drawNose() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 50, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FF6347';
        this.ctx.fill();
    }

    drawMouth(phoneme) {
    const viseme = this.phonemeToVisemeMap[phoneme] || 'neutral';
    switch (viseme) {
        case 'open':
            this.drawOpenFrontUnroundedMouth();
            break;
        case 'close':
            this.drawCloseFrontUnroundedMouth();
            break;
        case 'near-close':
            this.drawNearCloseFrontUnroundedMouth();
            break;
        case 'close-back':
            this.drawCloseBackRoundedMouth();
            break;
        case 'near-close-back':
            this.drawNearCloseNearBackRoundedMouth();
            break;
        case 'open-back':
            this.drawOpenBackRoundedMouth();
            break;
        case 'close-back-rounded':
            this.drawCloseBackRoundedMouth();
            break;
        case 'near-close-near-back-rounded':
            this.drawNearCloseNearBackRoundedMouth();
            break;
        case 'open-back-rounded':
            this.drawOpenBackRoundedMouth();
            break;
        case 'diphthong-ay':
            this.drawDiphthongAyMouth();
            break;
        case 'diphthong-aw':
            this.drawDiphthongAwMouth();
            break;
        case 'diphthong-oy':
            this.drawDiphthongOyMouth();
            break;
        case 'diphthong-iy':
            this.drawDiphthongIyMouth();
            break;
        case 'diphthong-uw':
            this.drawDiphthongUwMouth();
            break;
        default:
            this.drawNeutralMouth();
            break;
    }
}

drawOpenFrontUnroundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 35, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // Add tongue position
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 110);
    this.ctx.lineTo(this.canvas.width / 2 + 30, this.canvas.height / 2 + 110);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
}

drawCloseFrontUnroundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 25, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // Add tongue position
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - 25, this.canvas.height / 2 + 100);
    this.ctx.lineTo(this.canvas.width / 2 + 25, this.canvas.height / 2 + 100);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
}

drawNearCloseFrontUnroundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 85, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // Add tongue position
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 95);
    this.ctx.lineTo(this.canvas.width / 2 + 30, this.canvas.height / 2 + 95);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
}

drawCloseBackRoundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500'; // Orange color
    this.ctx.fill();
    
    // Add rounded lips
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 95, 18, 0, Math.PI);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Add tongue position
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFF'; // White color
    this.ctx.fill();
}

drawNearCloseNearBackRoundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 85, 22, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500'; // Orange color
    this.ctx.fill();
    
    // Add rounded lips
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 20, 0, Math.PI);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Add tongue position
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 95, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFF'; // White color
    this.ctx.fill();
}

drawOpenBackRoundedMouth() {
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500'; // Orange color
    this.ctx.fill();
    
    // Add rounded lips
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 105, 25, 0, Math.PI);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Add jaw position
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - 40, this.canvas.height / 2 + 110);
    this.ctx.lineTo(this.canvas.width / 2 + 40, this.canvas.height / 2 + 110);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
}

drawDiphthongAyMouth() {
    // Start shape (close front unrounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 80, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // End shape (open front unrounded)
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2 + 100);
    this.ctx.quadraticCurveTo(this.canvas.width / 2, this.canvas.height / 2 + 120, this.canvas.width / 2 + 30, this.canvas.height / 2 + 100);
    this.ctx.strokeStyle = '#000080'; // Navy blue color
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Transition line
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 90);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 110);
    this.ctx.strokeStyle = '#808080'; // Gray color
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
}

drawDiphthongAwMouth() {
    // Start shape (open front unrounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // End shape (close back rounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500'; // Orange color
    this.ctx.fill();
    
    // Add rounded lips
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 95, 18, 0, Math.PI);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Transition line
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 105);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 95);
    this.ctx.strokeStyle = '#808080'; // Gray color
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
}

drawDiphthongOyMouth() {
    // Start shape (open back rounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500'; // Orange color
    this.ctx.fill();
    
    // Add rounded lips
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 105, 25, 0, Math.PI);
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // End shape (close front unrounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 80, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // Transition line
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 105);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 90);
    this.ctx.strokeStyle = '#808080'; // Gray color
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
}

drawDiphthongIyMouth() {
    // Start shape (close front unrounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 80, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // End shape (near-close near-front unrounded)
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 85, 22, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFF00'; // Yellow color
    this.ctx.fill();
    
    // Transition line
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 90);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 92);
    this.ctx.strokeStyle = '#808080'; // Gray color
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
}

    drawDiphthongUwMouth() {
        // Start shape (near-close near-back rounded)
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 85, 22, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFA500'; // Orange color
        this.ctx.fill();
        
        // Add rounded lips
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 20, 0, Math.PI);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // End shape (open front unrounded)
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 100, 30, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFF00'; // Yellow color
        this.ctx.fill();
        
        // Transition line
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + 95);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 105);
        this.ctx.strokeStyle = '#808080'; // Gray color
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawNeutralMouth() {
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 25, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();

        // Add mouth outline
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 + 90, 35, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    interpolateMouthShapes(currentShape, targetShape, progress) {
        const dx = targetShape.x - currentShape.x;
        const dy = targetShape.y - currentShape.y;

        return {
            x: currentShape.x + dx * progress,
            y: currentShape.y + dy * progress
        };
    }

    update() {
        if (this.transitionProgress < 1) {
            this.transitionProgress += this.deltaTime / this.transitionDuration;
            this.currentMouthState = this.interpolateMouthShapes(
                this.currentMouthState,
                this.targetMouthState,
                this.transitionProgress
            );
            
            // Clear canvas and redraw mouth shape
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawFace();
            this.drawEyes();
            this.drawNose();
            this.drawMouth(this.phoneme);
        } else {
            this.transitionProgress = 0;
            this.currentMouthState = this.targetMouthState;
        }
    }

    animate() {
        requestAnimationFrame(() => {
            this.update();
            this.animate(); // Recursively call animate for continuous animation
        });
    }

    changePhoneme(newPhoneme) {
        if (newPhoneme !== this.phoneme) {
            this.phoneme = newPhoneme;
            this.targetMouthState = { x: 0, y: 0 }; // Reset to initial state
            this.transitionProgress = 0;
        }
    }
}

