using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Point
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public float Latitude { get; set; }
    
    [Required]
    public float Longitude { get; set; }
    
    public string? Comment { get; set; }
    
    public int? Order { get; set; }
    
    public bool Validated { get; set; } = false;
    
    public bool IsPointOfInterest { get; set; } = false;
    
    public Guid? EquipmentId { get; set; }
    
    [ForeignKey("EventId")]
    [JsonIgnore]
    public Event? Event { get; set; }

    [ForeignKey("EquipmentId")]
    [JsonIgnore]
    public Equipment? Equipment { get; set; }
    
    [JsonIgnore]
    public ICollection<Picture>? Pictures { get; set; }
}

