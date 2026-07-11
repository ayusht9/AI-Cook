import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser and pulling from HF hub
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
    static task = 'text2text-generation';
    static model = 'Xenova/LaMini-Flan-T5-77M'; // Lightweight text generation model
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // We expect the message to have a prompt
    const { prompt } = event.data;

    try {
        // Load pipeline
        const generator = await PipelineSingleton.getInstance(x => {
            self.postMessage({ status: 'progress', ...x });
        });

        self.postMessage({ status: 'generating' });
        
        // Generate plan
        // This is a very small model, so the prompt needs to be extremely simple and structured.
        const output = await generator(prompt, {
            max_new_tokens: 256,
            temperature: 0.7,
            repetition_penalty: 1.2,
        });

        self.postMessage({
            status: 'complete',
            output: output[0].generated_text,
        });

    } catch (err) {
        self.postMessage({ status: 'error', error: err.message });
    }
});
