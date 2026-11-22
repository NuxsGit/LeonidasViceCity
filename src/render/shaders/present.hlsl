// The game's picture letterboxed into the target: one quad from the vertex id (triangle strip of 4).
// Enhanced for Leonidas ViceCityStories (LVCS) with modern 80s Remake color grading, neon bloom, and ACES tonemapping.
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

// ACES Filmic Tone Mapping
float3 acesFilm(float3 x)
{
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

float4 ps_main(VSOut i) : SV_Target
{
    float4 col = picture.Sample(pictureSampler, i.uv);

    if (postFx.x > 0.5)
    {
        // Leonidas ViceCityStories (LVCS) HD Remake Post-Processing
        float3 rgb = col.rgb;

        // Warm sunset / cool neon color contrast
        rgb.r = pow(max(rgb.r, 0.0), 0.95) * 1.04;
        rgb.g = pow(max(rgb.g, 0.0), 0.98) * 0.98;
        rgb.b = pow(max(rgb.b, 0.0), 0.92) * 1.08;

        // Neon glow threshold extraction and subtle bloom
        float3 bloom = max(rgb - 0.72, 0.0) * 1.4;
        rgb += bloom * max(postFx.y, 0.1);

        // ACES Filmic Tonemapping
        rgb = acesFilm(rgb * 1.12);

        // Smooth contrast curve
        rgb = smoothstep(0.0, 1.0, rgb);

        // Subtle vignette for cinematic atmosphere
        float2 vigCoord = (i.uv / max(uvMax, 0.001)) - 0.5;
        float vig = 1.0 - dot(vigCoord, vigCoord) * 0.32;
        rgb *= saturate(vig);

        col.rgb = rgb;
    }

    return col;
}
