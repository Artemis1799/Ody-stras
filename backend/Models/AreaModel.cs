using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Area
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid EventId { get; set; }
    
    [MaxLength(255)]
    public string? Name { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string ColorHex { get; set; } = "#000000";
    
    [Required]
    [Column(TypeName = "TEXT")]
    public string GeoJson { get; set; } = string.Empty;
    
    [ForeignKey("EventId")]
    [JsonIgnore]
    public Event? Event { get; set; }
}
