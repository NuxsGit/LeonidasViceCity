// The game's picture letterboxed into the target: one quad from the vertex id (triangle strip of 4).
// Enhanced for Leonidas ViceCityStories (LVCS) with GTA Vice City Remastered visuals:
// - Edge-smoothing anti-aliasing (smooths 3D model polygon edges without pixelation)
// - Sun-drenched Miami tropical lighting & crystal clear azure sky
// - Saturated 80s Vice City color grading (scarlet red cars, turquoise ocean, emerald palms, Tommy blue suit)
// - ACES filmic tonemapping with balanced dynamic range
cbuffer Params : register(b0)
{
    float4 rect;   // NDC: left, top, right, bottom
    float2 uvMax;  // the used part of the texture
    float2 postFx; // x = mode (0 = original, 1 = LVCS HD Remake), y = intensity
};

struct VSOut
{
    float4 pos : SV_Position;
    float2 uv : TEXCOORD0;
};

VSOut vs_main(uint id : SV_VertexID)
{
    const float2 c = float2(id & 1, id >> 1);
    VSOut o;
    o.pos = float4(lerp(rect.x, rect.z, c.x), lerp(rect.y, rect.w, c.y), 0.0, 1.0);
    o.uv = c * uvMax;
    return o;
}

Texture2D picture : register(t0);
SamplerState pictureSampler : register(s0);

// ACES Filmic Tone Mapping curve
float3 acesFilm(float3 x)
{
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

// Perceptual luminance
float luma(float3 rgb)
{
    return dot(rgb, float3(0.299f, 0.587f, 0.114f));
}

float4 ps_main(VSOut i) : SV_Target
{
    if (postFx.x <= 0.5)
    {
        return picture.Sample(pictureSampler, i.uv);
    }

    // --- LVCS HD REMAKE - GTA VICE CITY GRAPHICS ENGINE ---
    // 1. Edge-Smoothing Anti-Aliasing Filter (FXAA-inspired cross-sample edge filter)
    // Eliminates polygon staircases and harsh pixelation while preserving original model geometry.
    float2 texelSize = uvMax * float2(1.0 / 1600.0, 1.0 / 900.0);

    float4 center = picture.Sample(pictureSampler, i.uv);
    float4 colN = picture.Sample(pictureSampler, i.uv + float2(0.0, -texelSize.y));
    float4 colS = picture.Sample(pictureSampler, i.uv + float2(0.0,  texelSize.y));
    float4 colW = picture.Sample(pictureSampler, i.uv + float2(-texelSize.x, 0.0));
    float4 colE = picture.Sample(pictureSampler, i.uv + float2( texelSize.x, 0.0));

    float lC = luma(center.rgb);
    float lN = luma(colN.rgb);
    float lS = luma(colS.rgb);
    float lW = luma(colW.rgb);
    float lE = luma(colE.rgb);

    float lMin = min(lC, min(min(lN, lS), min(lW, lE)));
    float lMax = max(lC, max(max(lN, lS), max(lW, lE)));
    float lRange = lMax - lMin;

    float3 baseRgb = center.rgb;
    // When high local contrast edge is detected, blend with neighbour cross-average to smooth edges
    if (lRange > 0.08)
    {
        float3 blurCol = (colN.rgb + colS.rgb + colW.rgb + colE.rgb + center.rgb * 2.0) / 6.0;
        float edgeBlend = saturate((lRange - 0.08) * 2.5);
        baseRgb = lerp(baseRgb, blurCol, edgeBlend * 0.55);
    }

    // 2. GTA Vice City Remastered Tropical Palette & Sunlight
    // Vibrant Miami daylight: vivid sky blue, lush palm greens, cherry red cars, classic blue suit
    float3 rgb = baseRgb;

    // Atmospheric clarity & sunny illumination
    // Enhance blue/cyan sky tones
    if (rgb.b > rgb.r * 1.1 && rgb.b > rgb.g * 0.9)
    {
        // Tropical Miami Sky booster
        rgb.b = pow(max(rgb.b, 0.0), 0.94) * 1.08;
        rgb.g = pow(max(rgb.g, 0.0), 0.96) * 1.02;
    }

    // Sunlit warm highlights on vehicle lacquer and clothing
    float highlight = max(dot(rgb, float3(0.333, 0.333, 0.333)) - 0.65, 0.0);
    rgb += float3(highlight * 0.18, highlight * 0.12, highlight * 0.04);

    // Tropical Vibrancy: boost saturation on midtone vehicles, vegetation, and clothing
    float lum = luma(rgb);
    float3 lumaVec = float3(lum, lum, lum);
    float3 chroma = rgb - lumaVec;
    rgb = lumaVec + chroma * 1.22; // +22% tropical saturation

    // Sunny Specular Bloom on intense reflections and lights
    float3 bloom = max(rgb - 0.78, 0.0) * 1.25;
    rgb += bloom * max(postFx.y * 0.75, 0.1);

    // ACES Filmic Tone Mapping for cinematic dynamic range
    rgb = acesFilm(rgb * 1.08);

    // Smooth contrast roll-off
    rgb = smoothstep(0.01, 0.99, rgb);

    // Very subtle atmospheric edge vignette (Vice City 80s lens feel)
    float2 vigCoord = (i.uv / max(uvMax, 0.001)) - 0.5;
    float vig = 1.0 - dot(vigCoord, vigCoord) * 0.18;
    rgb *= saturate(vig);

    return float4(rgb, center.a);
}
