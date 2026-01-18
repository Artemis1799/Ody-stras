using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Planning
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid TeamId { get; set; }
    
    [ForeignKey("TeamId")]
    [JsonIgnore]
    public Team? Team { get; set; }
    
    [JsonIgnore]
    public ICollection<Action>? Actions { get; set; }
}
