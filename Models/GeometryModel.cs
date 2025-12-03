using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Geometry
{
    [Key]
    [JsonPropertyName("uuid")]
    public Guid UUID { get; set; }
    
    [Required]
    [JsonPropertyName("eventId")]
    public Guid EventId { get; set; }
    
    [Required]
    [MaxLength(50)]
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty; // Point, LineString, Polygon, etc.
    
    // Stocké en base de données comme string
    [Required]
    [Column(TypeName = "TEXT")]
    [JsonIgnore]
    public string GeoJsonString { get; set; } = string.Empty;
    
    // Exposé à l'API comme objet JSON
    [NotMapped]
    [JsonPropertyName("geoJson")]
    public JsonElement GeoJson 
    { 
        get => string.IsNullOrEmpty(GeoJsonString) ? new JsonElement() : JsonSerializer.Deserialize<JsonElement>(GeoJsonString);
        set => GeoJsonString = JsonSerializer.Serialize(value);
    }
    
    // Stocké en base de données comme string
    [Column(TypeName = "TEXT")]
    [JsonIgnore]
    public string PropertiesString { get; set; } = "{}";
    
    // Exposé à l'API comme objet JSON
    [NotMapped]
    [JsonPropertyName("properties")]
    public JsonElement Properties 
    { 
        get => string.IsNullOrEmpty(PropertiesString) ? new JsonElement() : JsonSerializer.Deserialize<JsonElement>(PropertiesString);
        set => PropertiesString = JsonSerializer.Serialize(value);
    }
    
    [Required]
    [JsonPropertyName("created")]
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    [Required]
    [JsonPropertyName("modified")]
    public DateTime Modified { get; set; } = DateTime.UtcNow;
    
    [JsonIgnore]
    [ForeignKey("EventId")]
    public Event? Event { get; set; }
}
