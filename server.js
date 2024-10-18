// server.js
import express from 'express';
import path from 'path';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {OpenAI } from 'openai';

dotenv.config();

const app = express();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

const allModels = [
  { name: 'flux-pro', slug: 'black-forest-labs/flux-schnell' },
  { name: 'sdxl', slug: 'stability-ai/sdxl' },
   { name: 'DreamShaper', slug: 'prompthero/dreamshaper' },
   { name: 'openjourney', slug: 'prompthero/openjourney' },
    { name: 'waifu', slug: 'cjwbw/waifu-diffusion' },
    { name: 'Kandinsky 2', slug: 'ai-forever/kandinsky-2' },
  
];

// Define a map for negative prompts
const negativePrompts = {
'flux-pro': '(worst quality:2),(low quality:2),(blurry:2),bad_prompt,text',
'sdxl': 'twins, multiple faces, multiple figures, duplicate figures, group, crowd, side views, side profiles, overlapping figures, extra limbs, disembodied faces, reflections, mirrored images, twins, duplicates, realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
'DreamShaper': 'complex details, realistic shading, photorealism, cluttered background',
'openjourney': 'realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
'Kandinsky 2': 'cropped image, partial face, side view, obscured face, close-up, extreme close-up, background elements'
};

const perspective = {
  'Surrealist': 'strange distortions of reality to challenge perceptions ,evoke a sense of wonder, mystery',
  'Fantasy': 'twins, multiple faces, multiple figures, duplicate figures, group, crowd, side views, side profiles, overlapping figures, extra limbs, disembodied faces, reflections, mirrored images, twins, duplicates, realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
  'DreamShaper': 'complex details, realistic shading, photorealism, cluttered background',
  'openjourney': 'realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
  'Kandinsky 2': 'cropped image, partial face, side view, obscured face, close-up, extreme close-up, background elements'
  };

  const colorPallets = {
    'Surrealist': 'strange distortions of reality to challenge perceptions ,evoke a sense of wonder, mystery',
    'sdxl': 'twins, multiple faces, multiple figures, duplicate figures, group, crowd, side views, side profiles, overlapping figures, extra limbs, disembodied faces, reflections, mirrored images, twins, duplicates, realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
    'DreamShaper': 'complex details, realistic shading, photorealism, cluttered background',
    'openjourney': 'realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic',
    'Kandinsky 2': 'cropped image, partial face, side view, obscured face, close-up, extreme close-up, background elements'
    };

    const randomSeed = Math.floor(Math.random() * 10000); // Dynamic seed for more randomness

const surrealcolorPalettes = [
  "neon pastel gradients", 
  "vibrant contrasting colors", 
  "dreamlike soft tones", 
  "acidic fluorescent hues", 
  "earthy desert tones"
];

const creativeAspectRatios = ["16:9", "1:2", "4:3", "3:2"]; // Non-standard aspect ratios for creative effect




// Initialize Replicate client with API key from environment variables
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // Updated to use environment variable
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Updated to use environment variable
});

class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// server.js
// server.js

// server.js

app.post('/predict', async (req, res) => {
    const { imageData, characterStyle, backgroundStyle, artType } = req.body;
  
    // List of questions to ask the model
    const questions = [
      "what is the gender of the person in the photo",  
      "What is the overall shape of the face? (oval, round, square, or heart-shaped)" ,
      "Is the jawline sharp, rounded, or soft?",
      "Is the chin prominent or soft?",
      "Is the forehead broad or narrow?",
      "Is the forehead tall or short?",
      "Is the hairline straight, receding, or has a widow’s peak?",
      "Are the eyes almond-shaped, round, or hooded?",
      "Are the eyes large or small relative to the face?",
      "Are the eyes wide-set or close-set?",
      "What is the color of the eyes?",
      "Are the eyebrows arched, straight, or rounded?",
      "Are the eyebrows thick or thin?",
      "What is the distance between the eyebrows and the eyes? (close or far)",
      "Is the nose straight, hooked, or upturned?",
      "Is the nose long, short, narrow, or wide?",
      "Is the bridge of the nose prominent or flat?",
      "Are the nostrils wide or narrow?",
      "Are the lips full, thin, or asymmetrical?",
      "Are the lips wide or narrow relative to the face?",
      "What is the shape of the upper lip's center (Cupid's bow)? (defined or subtle)",
      "Are the cheekbones high, prominent, or flat?",
      "Are the cheeks full or hollow?",
      "Are the ears large, small, or average relative to the face?",
      "Are the ears round, pointed, or lobed in shape?",
      "What is the height of the ears in relation to the eyes? (aligned, higher, or lower)",
      "Is the hair curly, wavy, or straight?",
      "Is the hair fine, coarse, or medium in texture?",
      "What is the color of the hair?",
      "Is the hair long, medium, or short?",
      "Is there a full beard, mustache, or just stubble?",
      "Is the facial hair dense, patchy, or thin?",
      "What is the overall skin tone?",
      "Are there any freckles, moles, or blemishes visible?",
      "Are the teeth visible when smiling?",
      "What is the shape of the smile? (broad, closed-lip, etc.)"
    ];
  
    try {
      // Initialize an object to hold question-answer pairs
      const qaPairs = {};
      // const maxRetries=3;
    
      //   // Use Promise.all to run API calls concurrently
      //   const predictionPromises = questions.map(async (question) => {
      //     let attempt = 0; // Initialize attempt for each question
      //     let predictionData;

      //     while (attempt < maxRetries) {
      //       // Prepare the input for the model
      //       const input = {
      //         image: imageData, // Base64-encoded image data
      //         task: 'visual_question_answering',
      //         question: question
      //       };
  
      //       // Make the API call to Replicate
      //       const prediction = await fetch('https://api.replicate.com/v1/predictions', {
      //         method: 'POST',
      //         headers: {
      //           'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
      //           'Content-Type': 'application/json'
      //         },
      //         body: JSON.stringify({
      //           version: '2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
      //           input: input
      //         })
      //       });
  
      //       // Check if the response is OK (status in the range 200-299)
      //       if (!prediction.ok) {
      //         console.error(`Prediction failed for question: "${question}". Status: ${prediction.status}`);
      //         attempt++;
      //         console.log(`Retrying... Attempt ${attempt}/${maxRetries}`);
      //         continue; // Retry the request
      //       }
  
      //       predictionData = await prediction.json();
  
      //       if (prediction.status !== 201) {
      //         console.error('Prediction creation failed:', predictionData);
      //         throw new Error(predictionData.detail || 'Failed to create prediction');
      //       }

      //       while(attempt<maxRetries)
      //    {
      //       // Poll for prediction results
      //       let result = await pollPrediction(predictionData.urls.get);

      //       if (!prediction.ok) {
      //         result.error(`Prediction failed for question: "${question}". Status: ${prediction.status}`);
      //         attempt++;
      //         console.log(`Retrying... Attempt ${attempt}/${maxRetries}`);
      //         continue; // Retry the request
      //       }
  
      //       // Clean the answer by removing any prefixes like "Answer:"
      //       let answer = result.output.replace(/^Answer:\s*/i, '').trim();
      //       // Store the question and answer in the qaPairs object
      //       qaPairs[question] = answer;
      //       break;
      //     }
      //       break; // Exit the retry loop if successful
      //     }
      //   });
      //   // Wait for all predictions to complete
      //   await Promise.all(predictionPromises);
  
        // Combine all the answers into an optimized prompt
       // const optimizedPrompt = optimizePrompt(qaPairs);
        //const optimizedPrompt = 
       // console.log("optimizedPrompt=="+optimizedPrompt);
        // Generate a refined prompt using OpenAI, including styles
      //  const refinedPrompt = await generateRefinedPrompt(optimizedPrompt, characterStyle, backgroundStyle, artType);
      //  console.log("refinedPrompt=="+refinedPrompt);
  const refinedPrompt="userid1 is a simple sticky figure comic style based on the following brown irises, straight eyebrows, male gender, straight hairline, straight forehead, no, round eyes, flat nose bridge, very close eyebrow-to-eye distance, short nose, crisscrossed Cupid's bow, round-shaped face, close up eyes, contemplative lips, straight nose, ears higher to eyes, straight hair, round smile, caucasian skin tone, sharp jawline, full cheeks, visible teeth when smiling, thin eyebrows, wide lips, tall forehead, wide nostrils, small eyes, short hair length, flat cheekbones, larger ears, black hair color, soft chin, coarse hair texture, spiky facial hair, round ears";
        // Return the question-answer pairs and the optimized prompt
        res.json({ qaPairs, refinedPrompt });
      
    } catch (error) {
      console.error('Error during prediction:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Function to generate a refined prompt using OpenAI
async function generateRefinedPrompt(optimizedPrompt, characterStyle, backgroundStyle, artType) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use the appropriate model
        messages: [
            { 
                role: 'user', 
                content: `Transform the following into a comic avatar with the following styles:\n\n${optimizedPrompt}\nCharacter Style: ${characterStyle}\nBackground Style: ${backgroundStyle}\nType of Art: ${artType}` 
            }
        ],
        max_tokens: 1000, // Adjust as needed
    });

    // Loop through response.choices and log all choices
    response.choices.forEach((choice, index) => {
        console.log(`Choice ${index + 1}:`, choice.message.content);
    });

    return response.choices[0].message.content; // Return the generated prompt
}
  
  // Function to optimize the answers into a meaningful prompt
  function optimizePrompt(qaPairs) {
    // Initialize an array to hold prompt components
    let promptComponents = [];
    console.log("qaPairs"+qaPairs)
    // Loop through each question and answer to build the prompt
    for (const [question, answer] of Object.entries(qaPairs)) {
      // Skip answers that are empty or non-informative
      if (!answer || answer.toLowerCase().includes('unknown') || answer.toLowerCase().includes('n/a')) {
        continue;
      }
  
      // Extract key information based on the question
      switch (question) {
        case "what is the gender of the person in the photo":
          promptComponents.push(`${answer} gender`);
          break;
        case "What is the overall shape of the face? (oval, round, square, or heart-shaped)":
          promptComponents.push(`${answer}-shaped face`);
          break;
        case "Is the jawline sharp, rounded, or soft?":
          promptComponents.push(`${answer} jawline`);
          break;
        case "Is the chin prominent or soft?":
          promptComponents.push(`${answer} chin`);
          break;
        case "Is the forehead broad or narrow?":
          promptComponents.push(`${answer} forehead`);
          break;
        case "Is the forehead tall or short?":
          promptComponents.push(`${answer} forehead`);
          break;
        case "Is the hairline straight, receding, or has a widow’s peak?":
          promptComponents.push(`${answer} hairline`);
          break;
        case "Are the eyes almond-shaped, round, or hooded?":
          promptComponents.push(`${answer} eyes`);
          break;
        case "Are the eyes large or small relative to the face?":
          promptComponents.push(`${answer} eyes`);
          break;
        case "Are the eyes wide-set or close-set?":
          promptComponents.push(`${answer} eyes`);
          break;
        case "What is the color of the eyes?":
          promptComponents.push(`${answer} irises`);
          break;
        case "Are the eyebrows arched, straight, or rounded?":
          promptComponents.push(`${answer} eyebrows`);
          break;
        case "Are the eyebrows thick or thin?":
          promptComponents.push(`${answer} eyebrows`);
          break;
        case "What is the distance between the eyebrows and the eyes? (close or far)":
          promptComponents.push(`${answer} eyebrow-to-eye distance`);
          break;
        case "Is the nose straight, hooked, or upturned?":
          promptComponents.push(`${answer} nose`);
          break;
        case "Is the nose long, short, narrow, or wide?":
          promptComponents.push(`${answer} nose`);
          break;
        case "Is the bridge of the nose prominent or flat?":
          promptComponents.push(`${answer} nose bridge`);
          break;
        case "Are the nostrils wide or narrow?":
          promptComponents.push(`${answer} nostrils`);
          break;
        case "Are the lips full, thin, or asymmetrical?":
          promptComponents.push(`${answer} lips`);
          break;
        case "Are the lips wide or narrow relative to the face?":
          promptComponents.push(`${answer} lips`);
          break;
        case "What is the shape of the upper lip's center (Cupid's bow)? (defined or subtle)":
          promptComponents.push(`${answer} Cupid's bow`);
          break;
        case "Are the cheekbones high, prominent, or flat?":
          promptComponents.push(`${answer} cheekbones`);
          break;
        case "Are the cheeks full or hollow?":
          promptComponents.push(`${answer} cheeks`);
          break;
        case "Are the ears large, small, or average relative to the face?":
          promptComponents.push(`${answer} ears`);
          break;
        case "Are the ears round, pointed, or lobed in shape?":
          promptComponents.push(`${answer} ears`);
          break;
        case "What is the height of the ears in relation to the eyes? (aligned, higher, or lower)":
          promptComponents.push(`ears ${answer} to eyes`);
          break;
        case "Is the hair curly, wavy, or straight?":
          promptComponents.push(`${answer} hair`);
          break;
        case "Is the hair fine, coarse, or medium in texture?":
          promptComponents.push(`${answer} hair texture`);
          break;
        case "What is the color of the hair?":
          promptComponents.push(`${answer} hair color`);
          break;
        case "Is the hair long, medium, or short?":
          promptComponents.push(`${answer} hair length`);
          break;
        case "Is there a full beard, mustache, or just stubble?":
          promptComponents.push(`${answer}`);
          break;
        case "Is the facial hair dense, patchy, or thin?":
          promptComponents.push(`${answer} facial hair`);
          break;
        case "What is the overall skin tone?":
          promptComponents.push(`${answer} skin tone`);
          break;
        case "Are there any freckles, moles, or blemishes visible?":
          if (answer.toLowerCase() !== 'no') {
            promptComponents.push(`${answer}`);
          }
          break;
        case "Are the teeth visible when smiling?":
          if (answer.toLowerCase() === 'yes') {
            promptComponents.push(`visible teeth when smiling`);
          }
          break;
        case "What is the shape of the smile? (broad, closed-lip, etc.)":
          promptComponents.push(`${answer} smile`);
          break;
        default:
          // Include any other answers
          promptComponents.push(answer);
          break;
      }
    }
  
    console.log("promptComponent"+promptComponents);
    // Combine all components into a single prompt
    let prompt = promptComponents.join(', ');

  
    // Add any additional descriptions or styles
   // prompt += ', portrait photography, stick figure';
  
    return prompt;
  }
  
  // Function to poll for prediction results remains the same
  
  
    
  
  

// New endpoint to generate images using text-to-image models
app.post('/generate-images', async (req, res, next) => {
    const { caption,characterStyle, backgroundStyle, artType } = req.body;

    // List of all available models with their names and slugs
     // List of all available models with their names and slugs
    //  const allModels = [
    //     { name: 'Stable Diffusion', slug: 'stability-ai/stable-diffusion' },
   //      { name: 'OpenJourney', slug: 'prompthero/openjourney' },
    //     { name: 'DreamShaper', slug: 'prompthero/dreamshaper' },
    //     { name: 'Waifu Diffusion', slug: 'cjwbw/waifu-diffusion' },
    //     { name: 'Kandinsky 2', slug: 'ai-forever/kandinsky-2' },
    // ];





    try {
        const outputs = [];

        // Handle API requests concurrently using Promise.all
        await Promise.all(allModels.map(async (model) => {
            try {
               const inputParams = getInputParams(caption, modelName);
                const output = await generateImage(model.slug, inputParams);
                outputs.push({
                    modelName: model.name,
                    image: output,
                });
            } catch (error) {
                console.error(`Error generating image with ${model.name}:`, error);
                outputs.push({
                    modelName: model.name,
                    image: null,
                    error: error.message,
                });
            }
        }));

        res.json({ outputs });
    } catch (error) {
        next(error);
    }
});



async function generateImage(modelSlug, inputParams) {
    try {
        const versionId = await getLatestVersionId(modelSlug);

        if (!versionId) {
            throw new ApiError(`Could not retrieve version ID for model`, 404);
        }
       
       

        const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "version": versionId,
                "input": inputParams
            })
        });

        // Ensure this line is present and correctly placed
        const predictionData = await predictionResponse.json();

        if (predictionResponse.status !== 201) {
            console.error('Image generation failed:', predictionData);
            throw new ApiError(predictionData.detail || 'Failed to create prediction', predictionResponse.status);
        }

        // Use predictionData for polling
        let result = await pollPrediction(predictionData.urls.get);

        // Handle different output formats
        if (Array.isArray(result.output)) {
            return result.output[0];
        } else if (typeof result.output === 'string') {
            return result.output;
        } else {
            throw new ApiError('Unexpected output format', 500);
        }
    } catch (error) {
        console.error(`Error generating image with ${modelSlug}:`, error);
        throw error;
    }
}


async function pollPrediction(url) {
    while (true) {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_KEY}`
            }
        });
        const data = await response.json();

        if (data.status === 'succeeded') {
            return data;
        } else if (data.status === 'failed') {
            throw new ApiError('Prediction failed', 500);
        }
    
        // Wait for a second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000)); 
    }
}

// Function to get input parameters based on model requirements
function getInputParams(prompt, modelName) {
    let inputParams;

    // Adjust input parameters based on the model name
    switch (modelName) {
        case 'flux-pro':
            inputParams = {
                seed:42,
                prompt: prompt,
                width: 512,
                height: 512,
                guidance_scale: 20,
                num_inference_steps: 30,
                negative_prompt: "(worst quality:2),(low quality:2),(blurry:2),bad_prompt,text"
            };
            break;

        case 'DreamShaper':
            inputParams = {
    seed:999,          
    prompt: "simple Impressionism style  with "+prompt,
    width: 512,
    height: 512,
    guidance_scale: 7.5,
    num_inference_steps: 30,
    negative_prompt: "complex details, realistic shading, photorealism, cluttered background"
  };
            break;

        case 'openjourney':
            inputParams = {
                seed:42,
                prompt: "A basic art deco mural, no background "+prompt,
                width: 512,
                height: 512,
                guidance_scale: 7.5,
                num_inference_steps: 50,
                negative_prompt: "realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic"
           
            };
            break;
            case 'Kandinsky2':
  inputParams = {
    prompt: "A simple, front-facing, full-body cartoon stick figure with a smiling face, arms and legs extended, drawn in bold black lines on a plain white background, showing the entire figure from head to toe "+prompt,
    seed: 42,
    width: 512,
    height: 768,
    guidance_scale: 8,
    num_inference_steps: 50,
    negative_prompt: "cropped image, partial face, side view, obscured face, close-up, extreme close-up, background elements",
    sampler: 'ddim'
  }; break;

  case 'sdxl':
    seed: 42,
    inputParams = {
      prompt:"A Shojo Style anime figure, single character, front view, with one face, match eye color in prompt "+ prompt,
      width: 512,
      height: 768,
      guidance_scale: 15,
      num_inference_steps: 80,
      negative_prompt: "twins, multiple faces, multiple figures, duplicate figures, group, crowd, side views, side profiles, overlapping figures, extra limbs, disembodied faces, reflections, mirrored images, twins, duplicates, realism, detailed anatomy, shadows, textures, colors, background elements, complex details, 3D, photorealistic"
    };

    case 'waifu':
      inputParams = {
        seed: 42,
        prompt:"A solo Seinen-style anime character, full-body, front-facing, with one face, no other characters, simple line art, plain white background "+ prompt,
        width: 512,
        height: 768,
        guidance_scale: 9,
        num_inference_steps: 70,
        negative_prompt: "multiple people, multiple characters, extra faces, extra heads, groups, crowds, side views, side profiles, overlapping figures, extra limbs, disembodied faces, reflections, mirrored images, twins, duplicates, busy background, detailed scenery, photorealism, 3D rendering, complex designs"
      };
  
break;

        // Add more cases for other models as needed
        default:
            // Fallback parameters if model is not recognized
            inputParams = {
                prompt: prompt,
                width: 512,
                height: 768,
                guidance_scale: 10,
                num_inference_steps: 25,
                negative_prompt: ""
            };
            break;
    }

    return inputParams;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({ error: message });
});

// Function to get the latest version ID of a model
async function getLatestVersionId(modelSlug) {
    try {
        const response = await fetch(`https://api.replicate.com/v1/models/${modelSlug}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 200) {
            console.error(`Failed to get model info for this ${modelSlug} `);
            return null;
        }

        const data = await response.json();
        return data.latest_version.id;
    } catch (error) {
        console.error(`Error fetching latest version ID for model ${modelSlug}:`, error);
        return null;
    }
}





app.post('/generate-comic', async (req, res) => {
    const { journalEntry, refinedPrompt, selectedModel, selectedStyle } = req.body; // Include selectedStyle

    try {
        console.log("selectedModel " +selectedModel)
        console.log("journalEntry " +journalEntry)
        const perspectiveformodel=perspective[selectedStyle];
        // Construct the prompt for the OpenAI API with the new constraints
        const combinedPrompt = `
Write a creative ${selectedStyle} comic book short story about a person named userid1 based on user prompt provided.
Use narration composition style of writing.  
Determine an appropriate number of panels based on the length and complexity of the story. 
using as few panels as necessary (up to a maximum of 6).
Describe othe userid1's Textures and Materials in detail based on the ${selectedStyle} style.
Describe creatively in detail user promt's compostion like camera angles, lighting, and scene based on the ${selectedStyle} style.
Use widely different camera angles, lighting between panels.
use Perspective: ${perspectiveformodel}

Output Instructions:

Output ONLY the comic strip narrative as a valid JSON array, with no additional text, code blocks, explanations, or formatting before or after the JSON array. The JSON array should be the entirety of your response.
Do not include any headers, footers, comments, or code block markers (such as triple backticks).
Do not include phrases like "Number of panels" or any other text outside the JSON array.
Do not mention the steps or provide any reasoning in your response.
Ensure the JSON is properly formatted and valid.

**Mood based css:**
  Find all the object inthe user prompt.
- Generate a list of 4 unique sticker of the objects in the user prompt sentences.
- For each sticker, include:
  - The sticker's name.
  - Do not generate any faces in the sticker.
  - A brief description of the sticker.
  - A complex CSS3 animation code snippet applicable for each sticker. The animation should be applied to the individual sticker , be simple, loop smoothly, and be suitable for web use.
  - An image prompt optimized for generating the sticker's image using an image generation model.


**Output Instructions:**

- Output ONLY the comic strip narrative and sticker ideas as a valid JSON object with two properties: "panels" and "stickers".
- The "panels" property should be an array of panel objects as specified.
- The "stickers" property should be an array of sticker objects as specified.
- Do not include any additional text, code blocks, explanations, or formatting before or after the JSON object. The JSON object should be the entirety of your response.
- Do not include any headers, footers, comments, or code block markers.
- Do not mention the steps or provide any reasoning in your response.
- Ensure the JSON is properly formatted and valid.
`;


      // Call the OpenAI API with a timeout
 // Call the OpenAI API
 const response = await openAiWithTimeout(journalEntry, combinedPrompt, 'generate_comic_and_stickers');

 // Parse the response
 const assistantMessage = response.choices[0].message;
 const parsedResult = parseComicAndStickers(assistantMessage);

 const panelsArray = parsedResult.panels;
 const stickersArray = parsedResult.stickers;

 // Get the model slug from the dictionary
 const modelSlug = getModelSlug(selectedModel); 

 // Generate images for the comic panels
 const inputParamsArray = panelsArray.map(panel => ({
     prompt: refinedPrompt+" create the character and background in "+selectedStyle+" comic book artistic style. " 
     +panel.description,

     seed: 42,
     num_outputs: 1,
     aspect_ratio: "1:1",
     output_format: "webp",
     output_quality: 80,
     negative_prompt: negativePrompts[selectedModel],
     style: selectedStyle // Pass the selected style here
 }));

 // Use Promise.all to generate images for all panels concurrently
 const outputs = await Promise.all(inputParamsArray.map(inputParams => generateImage(modelSlug, inputParams)));

 // Assuming the response contains an array of image URLs in the output field
 const imageUrls = outputs; // Store the generated image URLs

 // Generate images for the stickers based on image prompts
 //const stickerImages = await generateStickerImages(stickersArray, modelSlug);

 // Return the generated data
 res.json({ comicStory: panelsArray, imageUrls, stickers: [] });

    } catch (error) {
        console.error('Error generating comic:', error); // Log the error for debugging
        res.status(500).json({ error: error.message }); // Send a response with the error message
    }
});

function parseComicAndStickers(message) {
  let content;

  // Check if the assistant used function calling
  if (message.function_call && message.function_call.arguments) {
      // Assistant returned the data in function_call.arguments
      content = message.function_call.arguments;
  } else if (message.content) {
      // Assistant returned the data in message.content
      content = message.content.trim();
  } else {
      console.error('Assistant did not provide the expected output.');
      throw new Error('Invalid response format received');
  }

  let result;
  try {
      result = JSON.parse(content);
      console.log('Parsed result:', result);
  } catch (error) {
      console.error('Failed to parse assistant response as JSON:', error);
      throw new Error('Invalid response format received');
  }

  // Validate the result structure
  if (!result.panels || !Array.isArray(result.panels)) {
      console.error('Panels are missing or invalid.');
      throw new Error('Invalid panels format received');
  }

  if (!result.stickers || !Array.isArray(result.stickers)) {
      console.error('Stickers are missing or invalid.');
      throw new Error('Invalid stickers format received');
  }

  // Additional validation can be added here for panels and stickers

  return result;
}



function getModelSlug(modelName) {
  console.log("modelName=="+modelName)
  const model = allModels.find(m => m.name === modelName);
  return model ? model.slug : null; // Returns the slug if found, otherwise null
}

// Function to generate images based on the comic story and selected model
async  function generateImages(panels, modelSlug,model) {
  

  if (!modelSlug) {
      throw new Error('Invalid model selected');
  }

  console.log('Using model slug:', modelSlug); // Log the model slug for debugging

  const inputParamsArray = panels.map(panel => ({
      prompt: panel.description,
      seed: 42,
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      negative_prompt: negativePrompts[model]
  }));

  // Use Promise.all to generate images for all panels concurrently
  const outputs = await Promise.all(inputParamsArray.map(inputParams => generateImage(modelSlug, inputParams)));

  // Assuming the response contains an array of image URLs in the output field
  const imageUrls = outputs; // Store the generated image URLs

  return imageUrls; // Return the array of generated image URLs
}


// Helper function to wrap the OpenAI API call with a timeout
function openAiWithTimeout(prompt, systemPrompt = '', functionName = '', timeout = 120000) {
  // Define the functions parameter if a function name is provided
  const functions = functionName ? [
      {
          name: functionName,
          description: "Generates a comic strip narrative and sticker ideas based on a journal entry.",
          parameters: {
              type: "object",
              properties: {
                  panels: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              panel: {
                                  type: "integer",
                                  description: "The panel number."
                              },
                              description: {
                                  type: "string",
                                  description: "Description of the panel."
                              }
                          },
                          required: ["panel", "description"]
                      }
                  },
                  stickers: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              name: {
                                  type: "string",
                                  description: "The sticker's name."
                              },
                              description: {
                                  type: "string",
                                  description: "A brief description of the sticker."
                              },
                              cssCode: {
                                  type: "string",
                                  description: "CSS3 animation code snippet for the sticker."
                              },
                              imagePrompt: {
                                  type: "string",
                                  description: "An image prompt suitable for generating the sticker's image."
                              }
                          },
                          required: ["name", "description", "cssCode", "imagePrompt"]
                      }
                  }
              },
              required: ["panels", "stickers"]
          }
      }
  ] : null;

  // Build the messages array
  const messages = [];
  if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  // Return a promise that resolves or rejects based on the API call
  return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
          reject(new Error('OpenAI API request timed out'));
      }, timeout);

      openai.chat.completions.create({
          model: 'gpt-4-0613',
          messages: messages,
          functions: functions || undefined,
          function_call: functions ? { name: functionName } : undefined,
          temperature: 1.1, // Set temperature to 0 for deterministic output
          max_tokens: 2000, // Adjust as needed
      }).then(response => {
          clearTimeout(timeoutId); // Clear the timeout if the request is successful
          resolve(response);
      }).catch(error => {
          clearTimeout(timeoutId); // Clear the timeout on error
          reject(error);
      });
  });
}





async function generateStickers(journalEntry) {
  // Define the prompt for the OpenAI API
  const prompt = `
Based on the following journal entry, generate a list of 3 unique sticker ideas. Each sticker should be inspired by the content and should have a short description. Output the list as a JSON array with each sticker's name and description.

Journal Entry:
"${journalEntry}"

Output format:
[
{
  "name": "Sticker Name",
  "description": "A brief description of the sticker."
},
...
]
`;

  // Call the OpenAI API
  const response = await openAiWithTimeout(prompt);

  // Check if the response is valid
  if (!response || !response.choices || !response.choices.length) {
      throw new Error('Invalid response format from OpenAI API');
  }

  // Extract and parse the assistant's response
  const assistantMessage = response.choices[0].message;

  let stickers;
  try {
      stickers = JSON.parse(assistantMessage.content.trim());
      console.log('Generated stickers:', stickers);
  } catch (error) {
      console.error('Failed to parse assistant response as JSON:', error);
      throw new Error('Invalid stickers format received');
  }

  return stickers; // Return the array of stickers
}

async function generateStickerAnimations(stickers) {
  const stickerAnimations = [];

  for (const sticker of stickers) {
      // Define the prompt for generating CSS animation
      const prompt = `
Create a unique CSS3 animation code snippet for the following sticker. The animation should be simple, loop smoothly, and be suitable for web use.

Sticker Name: ${sticker.name}
Description: ${sticker.description}

Output the CSS code only, without any explanations or additional text.
`;

      // Call the OpenAI API
      const response = await openAiWithTimeout(prompt);

      // Check if the response is valid
      if (!response || !response.choices || !response.choices.length) {
          throw new Error('Invalid response format from OpenAI API');
      }

      // Extract the assistant's response
      const assistantMessage = response.choices[0].message;

      const cssCode = assistantMessage.content.trim();

      // You may want to validate or sanitize the CSS code here

      stickerAnimations.push({
          name: sticker.name,
          cssCode: cssCode
      });
  }

  return stickerAnimations; // Return the array of stickers with their CSS animations
}


async function generateStickerImages(stickers,modelslug) {
  const stickerImages = [];

  for (const sticker of stickers) {
      const inputParams = {
          prompt: sticker.imagePrompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
          // Include any other parameters needed for your image generation function
      };

      // Use your image generation API to generate the image
      const output = await generateImage(modelslug, inputParams);
      console.log('Generated sticker image:', output);

      stickerImages.push({
          name: sticker.name,
          imageUrl: output, // Assuming the output is the image URL
          cssCode: sticker.cssCode,
      });
  }

  return stickerImages; // Return the array of sticker images with CSS animations
}




// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});