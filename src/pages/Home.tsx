import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Leaf, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default leaf image path
const DEFAULT_IMAGE = "/default-leaf.jpg";

// Default analysis for the leaf
const DEFAULT_ANALYSIS = `1. Species Identification:
- Scientific name: Acer rubrum
- Common name: Red Maple
- Family: Sapindaceae
- Classification: Deciduous broadleaf

2. Leaf Characteristics:
- Shape: Palmate with 3-5 lobes
- Margin: Serrated edges
- Size: Medium (3-5 inches wide)
- Color: Green in summer, vibrant red in fall
- Texture: Smooth on top, slightly fuzzy underneath
- Venation: Palmate venation pattern

3. Tree Information:
- Size: Medium to large (40-60 feet tall)
- Growth Rate: Moderate to fast
- Lifespan: 80-100 years
- Bark: Smooth and light gray when young, developing ridges with age
- Native Range: Eastern and Central North America

4. Ecological Significance:
- Wildlife Value: Seeds provide food for birds and small mammals
- Seasonal Changes: Spectacular red fall color
- Habitat: Adaptable to various environments, common in wetlands
- Ecosystem Role: Provides shade, habitat, and food for wildlife
- Pollination: Wind-pollinated

5. Additional Information:
- Uses: Ornamental landscaping, shade tree, maple syrup production
- Cultural Significance: State tree of Rhode Island
- Interesting Facts: One of the first trees to change color in fall
- Identification Tips: Look for opposite leaf arrangement and V-shaped seed pairs
- Similar Species: Sugar maple, silver maple (distinguished by leaf shape)`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const leafPrompt = "Analyze this leaf image for educational purposes and provide the following information:\n1. Species identification (scientific name, common name, family, classification)\n2. Leaf characteristics (shape, margin, size, color, texture, venation)\n3. Tree information (size, growth rate, lifespan, bark, native range)\n4. Ecological significance (wildlife value, seasonal changes, habitat, ecosystem role)\n5. Additional information (uses, cultural significance, interesting facts, identification tips)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, leafPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Leaf Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a leaf photo for educational identification and information about the leaf and its tree</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Leaf Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG or JPEG (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Leaf preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Leaf className="-ml-1 mr-2 h-5 w-5" />
                      Identify Leaf
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Leaf Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Leaf Identifier: Your Educational Guide to Leaves and Trees</h2>
          
          <p>Welcome to our free leaf identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different leaf types, their characteristics, and
             essential information about the trees they come from.</p>

          <h3>How Our Educational Leaf Identifier Works</h3>
          <p>Our tool uses AI to analyze leaf photos and provide educational information about species
             identification, leaf characteristics, and the trees they belong to. Simply upload a clear photo of a leaf,
             and our AI will help you learn about its species, features, and the tree it comes from.</p>

          <h3>Key Features of Our Leaf Identifier</h3>
          <ul>
            <li>Educational species information</li>
            <li>Detailed leaf characteristics</li>
            <li>Tree information and growth patterns</li>
            <li>Ecological significance</li>
            <li>Seasonal changes and variations</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Leaf and tree species identification</li>
            <li>Leaf morphology and structure</li>
            <li>Tree characteristics and growth</li>
            <li>Seasonal leaf changes</li>
            <li>Ecological roles of different trees</li>
          </ul>

          <p>Try our free leaf identifier today and deepen your knowledge of the natural world!
             No registration required - just upload a photo and start learning about leaves and their trees.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}