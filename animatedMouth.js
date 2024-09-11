class AnimatedMouth {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = new AudioContext();
        this.analyzer = null;
        this.frequencyData = new Uint8Array(256);
        this.mouthShape = 0;

        // Initialize canvas dimensions
        this.canvas.width = 400;
        this.canvas.height = 400;

        // Start audio processing
        this.startAudioProcessing();

        // Main animation loop
        requestAnimationFrame(this.animate.bind(this));
    }

    startAudioProcessing() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = this.audioContext.createMediaStreamSource(stream);
                this.analyzer = this.audioContext.createAnalyser();
                source.connect(this.analyzer);

                // Set up frequency analysis
                this.analyzer.fftSize = 512;
                this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount);
            })
            .catch(error => console.error('Error accessing audio:', error));
    }

    analyzeAudio() {
        if (!this.analyzer) return;
        
        this.analyzer.getByteFrequencyData(this.frequencyData);
        const averageVolume = this.frequencyData.reduce((sum, val) => sum + val, 0) / this.frequencyData.length;

        // Simple threshold-based mouth shape selection
        if (averageVolume > 100) {
            this.mouthShape = 2; // Open wide
        } else if (averageVolume > 50) {
            this.mouthShape = 1; // Slightly open
        } else {
            this.mouthShape = 0; // Closed
        }
    }

    drawCharacter() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw head
        this.ctx.beginPath();
        this.ctx.arc(200, 200, 150, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();

        // Draw eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(170, 180, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(230, 180, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw mouth based on current shape
        switch (this.mouthShape) {
            case 0: // Closed
                this.ctx.beginPath();
                this.ctx.arc(200, 250, 30, 0, Math.PI);
                this.ctx.stroke();
                break;
            case 1: // Slightly open
                this.ctx.beginPath();
                this.ctx.moveTo(160, 270);
                this.ctx.quadraticCurveTo(200, 280, 240, 270);
                this.ctx.stroke();
                break;
            case 2: // Open wide
                this.ctx.beginPath();
                this.ctx.moveTo(140, 290);
                this.ctx.quadraticCurveTo(200, 300, 260, 290);
                this.ctx.stroke();
                break;
        }
    }

    animate() {
        this.analyzeAudio();
        this.drawCharacter();
        requestAnimationFrame(this.animate.bind(this));
    }
}

new AnimatedMouth('characterCanvas');
