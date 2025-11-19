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

	public Guid EquipmentId { get; set; }
    
    public float? Latitude { get; set; }
    
    public float? Longitude { get; set; }
    
    public string? Comment { get; set; }
    
    public Guid? ImageId { get; set; }
    
    public int? Order { get; set; }
    
    public bool IsValid { get; set; } = false;
    
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    public DateTime Modified { get; set; } = DateTime.UtcNow;

	public int EquipmentQuantity { get; set; } = 0;
    
    [ForeignKey("EventId")]
    public Event? Event { get; set; }

    [ForeignKey("EquipmentId")]
    public Equipment? Equipment { get; set; }
    
    [JsonIgnore]
    public ICollection<ImagePoint> ImagePoints { get; set; } = new List<ImagePoint>();
}
