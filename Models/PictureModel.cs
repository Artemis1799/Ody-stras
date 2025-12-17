using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Picture
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid PointId { get; set; }
    
    public byte[] PictureData { get; set; } = Array.Empty<byte>();
    
    [ForeignKey("PointId")]
    [JsonIgnore]
    public Point? Point { get; set; }
}
