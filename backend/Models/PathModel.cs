using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class RoutePath
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string ColorHex { get; set; } = "#000000";
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    [Column(TypeName = "TEXT")]
    public string GeoJson { get; set; } = string.Empty;
    
    [ForeignKey("EventId")]
    [JsonIgnore]
    public Event? Event { get; set; }
}

